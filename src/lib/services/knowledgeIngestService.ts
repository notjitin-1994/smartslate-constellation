import { supabase as defaultClient, createAdminClient } from '@/lib/supabase';
import { generateText, embed, embedMany, generateObject } from 'ai';
import { google } from '@/lib/google';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { z } from 'zod';

export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string;
  contentType: ContentType;
  content: string; // Base64 for media/docs or raw text
  fileName: string;
  metadata?: Record<string, unknown>;
  blueprintContext?: Record<string, unknown> | null;
  useAdmin?: boolean; // New flag for server-side auth bypass
}

export class KnowledgeIngestService {
  async ingest(asset: IngestAsset) {
    console.log(`[Ingest] Incoming asset: ${asset.fileName} (${asset.contentType})`);
    if (['pdf', 'text', 'docx'].includes(asset.contentType)) {
      return this.ingestDocument(asset);
    } else {
      return this.ingestMultimodalAsset(asset);
    }
  }

  /**
   * Automatically harvests strategic facts from the Polaris Blueprint
   * Uses Admin Client (RLS Bypass) as this is a background system task.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async harvestBlueprint(blueprintId: string, blueprintJson: any) {
    console.log(`[Ingest] [HARVEST] Initializing Strategic Harvesting for: ${blueprintId}`);
    const admin = createAdminClient();
    
    try {
      // 1. Check if already harvested
      const { count } = await admin
        .from('knowledge_vault')
        .select('*', { count: 'exact', head: true })
        .eq('blueprint_id', blueprintId)
        .eq('content_type', 'text')
        .contains('metadata', { is_blueprint_source: true });

      if (count && count > 0) {
        console.log('[Ingest] [HARVEST] Strategic data already present. Skipping.');
        return;
      }

      // 2. Distill Blueprint to Atomic Facts with high-fidelity requirements
      const { text: blueprintFacts } = await generateText({
        model: google('gemini-3.1-pro-preview'), // Use Pro for better fact-gathering
        system: `You are an expert Strategic Data Harvester. 
        Your goal is to extract every verifiable metric, rule, and requirement from the Blueprint JSON.
        PAY CRITICAL ATTENTION TO AND EXPLICITLY CAPTURE:
        - Target Audience Details (e.g., "UG/PG students", roles, levels).
        - Delivery & Technical Config (e.g., "SCORM package", "Vimeo", "LMS").
        - Program Metrics (Durations, Passing Scores, Assessment counts).
        Output as a granular numbered list of core institutional facts.`,
        prompt: `BLUEPRINT_JSON:\n${JSON.stringify(blueprintJson)}`,
      });

      console.log(`[Ingest] [HARVEST] Extracted ${blueprintFacts.split('\n').length} strategic facts.`);

      // 3. Ingest into Vault
      const chunks = this.chunkText(blueprintFacts, 1000);
      const valuesToEmbed = chunks.map((chunk: string) => `[STRATEGIC_BLUEPRINT] \n\n DATA: ${chunk}`);
      
      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('gemini-embedding-2'),
        values: valuesToEmbed,
        providerOptions: { google: { outputDimensionality: 3072 } }
      });

      const rows = chunks.map((chunk: string, i: number) => ({
        blueprint_id: blueprintId,
        content_type: 'text',
        raw_content: chunk,
        contextual_header: 'Strategic Blueprint Core Data',
        embedding: embeddings[i],
        metadata: {
          source_name: 'POLARIS_BLUEPRINT',
          is_blueprint_source: true,
          chunk_index: i,
          processed_at: new Date().toISOString(),
        },
      }));

      await admin.from('knowledge_vault').insert(rows);
      console.log('[Ingest] [HARVEST] Strategic Blueprint successfully added to Truth Ledger.');
    } catch (err) {
      console.error('[Ingest] [HARVEST_ERROR]:', err);
    }
  }

  private async ingestDocument(asset: IngestAsset) {
    const supabase = asset.useAdmin ? createAdminClient() : defaultClient;
    let fullText = '';
    console.log(`[Ingest] Processing document: ${asset.fileName}`);

    try {
      if (asset.contentType === 'pdf') {
        console.log('[Ingest] Extracting PDF content...');
        const buffer = Buffer.from(asset.content, 'base64');
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const result = await extractText(pdf, { mergePages: true });
        fullText = result.text;
      } else if (asset.contentType === 'docx') {
        console.log('[Ingest] Extracting DOCX content...');
        const buffer = Buffer.from(asset.content, 'base64');
        const result = await mammoth.extractRawText({ buffer });
        fullText = result.value;
      } else {
        fullText = asset.content;
      }

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('Document extraction returned empty text.');
      }

      console.log(`[Ingest] Extraction success. Length: ${fullText.length}. Generating context and segregating...`);

      let modulesListStr = 'No modules available. Fallback to generic ingestion.';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bpContext: any = asset.blueprintContext;
      if (bpContext?.content_outline?.modules) {
        modulesListStr = bpContext.content_outline.modules.map((m: { title: string; description: string }, i: number) => `ID: NODE_0${i+1} | Title: ${m.title} | Desc: ${m.description}`).join('\n');
      }

      const { object } = await generateObject({
        model: google('gemini-3-flash-preview'),
        schema: z.object({
          contextHeader: z.string().describe('Overall institutional context of the document. Who is it for and what procedure/knowledge it conveys?'),
          moduleContents: z.array(z.object({
            moduleId: z.string().describe('The ID of the module, e.g. NODE_01'),
            relevantContent: z.string().describe('All extracted text from the document relevant to this module. Leave empty if none.')
          }))
        }),
        prompt: `You are an expert instructional design data parser. Read the document and segregate its content based on the provided modules. A document may contain content for multiple modules. Extract and assign the relevant sections to each matching module.\n\nModules:\n${modulesListStr}\n\nDocument:\n${fullText.substring(0, 50000)}`
      });

      console.log(`[Ingest] Context generated: ${object.contextHeader.substring(0, 50)}...`);

      const rows: Record<string, unknown>[] = [];
      for (const mc of object.moduleContents) {
        if (!mc.relevantContent || mc.relevantContent.trim() === '') continue;
        
        const chunks = this.chunkText(mc.relevantContent, 1000);
        if (chunks.length === 0) continue;
        
        console.log(`[Ingest] Embedding ${chunks.length} chunks for module ${mc.moduleId}...`);
        const valuesToEmbed = chunks.map((chunk: string) => `[MODULE: ${mc.moduleId}] [CONTEXT: ${object.contextHeader}] \n\n DATA: ${chunk}`);
        
        const { embeddings } = await embedMany({
          model: google.textEmbeddingModel('gemini-embedding-2'),
          values: valuesToEmbed,
          providerOptions: { google: { outputDimensionality: 3072 } }
        });

        const chunkRows = chunks.map((chunk: string, i: number) => ({
          blueprint_id: asset.blueprintId,
          content_type: asset.contentType,
          raw_content: chunk,
          contextual_header: object.contextHeader,
          embedding: embeddings[i],
          metadata: {
            ...(asset.metadata || {}),
            source_name: asset.fileName,
            module_id: mc.moduleId,
            chunk_index: i,
            total_chunks: chunks.length,
            processed_at: new Date().toISOString(),
          },
        }));
        rows.push(...chunkRows);
      }
      
      if (rows.length === 0) {
        console.warn(`[Ingest] No specific module content extracted. Falling back to generic ingestion.`);
        const chunks = this.chunkText(fullText, 1000);
        const valuesToEmbed = chunks.map((chunk: string) => `[CONTEXT: ${object.contextHeader}] \n\n DATA: ${chunk}`);
        
        const { embeddings } = await embedMany({
          model: google.textEmbeddingModel('gemini-embedding-2'),
          values: valuesToEmbed,
          providerOptions: { google: { outputDimensionality: 3072 } }
        });
        
        const chunkRows = chunks.map((chunk: string, i: number) => ({
          blueprint_id: asset.blueprintId,
          content_type: asset.contentType,
          raw_content: chunk,
          contextual_header: object.contextHeader,
          embedding: embeddings[i],
          metadata: {
            ...(asset.metadata || {}),
            source_name: asset.fileName,
            chunk_index: i,
            total_chunks: chunks.length,
            processed_at: new Date().toISOString(),
          },
        }));
        rows.push(...chunkRows);
      }

      console.log(`[Ingest] Storing ${rows.length} rows in Supabase...`);
      const { data, error } = await supabase.from('knowledge_vault').insert(rows).select();
      
      if (error) {
        console.error('[Ingest API Error]:', error);
        throw error;
      }
      
      console.log('[Ingest] Transaction Complete.');
      return { count: data ? data.length : 0, contextHeader: object.contextHeader };
    } catch (err) {
      console.error(`[Ingest Error] ${asset.fileName}:`, err);
      throw err;
    }
  }

  private async ingestMultimodalAsset(asset: IngestAsset) {
    const supabase = asset.useAdmin ? createAdminClient() : defaultClient;
    console.log(`[Ingest] Processing multi-modal: ${asset.fileName}`);
    try {
      const { text: description } = await generateText({
        model: google('gemini-3-flash-preview'),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this ${asset.contentType}. Generate a high-fidelity transcript and visual summary for instructional design grounding.`,
              },
              {
                type: 'file',
                data: asset.content,
                mediaType: this.getMimeType(asset.contentType, asset.fileName) as "image/png" | "image/jpeg" | "video/mp4",
              },
            ],
          },
        ],
      });

      console.log(`[Ingest] Media analysis complete. Embedding description...`);

      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-2'),
        value: description,
        providerOptions: {
          google: {
            outputDimensionality: 3072,
          }
        }
      });

      const { data, error } = await supabase
        .from('knowledge_vault')
        .insert({
          blueprint_id: asset.blueprintId,
          content_type: asset.contentType,
          raw_content: description,
          embedding,
          metadata: {
            ...(asset.metadata || {}),
            source_name: asset.fileName,
            is_multimodal: true,
            processed_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) {
        console.error('[Ingest API Error Media]:', error);
        throw error;
      }
      console.log('[Ingest] Media Stored successfully.');
      return data;
    } catch (err) {
      console.error(`[Ingest Error] Media ${asset.fileName}:`, err);
      throw err;
    }
  }

  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      chunks.push(text.substring(i, i + size * 4));
      i += size * 4;
    }
    return chunks;
  }

  private getMimeType(type: string, fileName: string): string {
    if (type === 'image') return fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    if (type === 'video') return 'video/mp4';
    if (type === 'pdf') return 'application/pdf';
    if (type === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return 'text/plain';
  }
}

export const knowledgeIngestService = new KnowledgeIngestService();
