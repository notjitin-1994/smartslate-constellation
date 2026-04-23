import { supabase } from '@/lib/supabase';
import { generateText, embed, embedMany } from 'ai';
import { google } from '@/lib/google';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string;
  contentType: ContentType;
  content: string; // Base64 for media/docs or raw text
  fileName: string;
  metadata?: Record<string, unknown>;
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

  private async ingestDocument(asset: IngestAsset) {
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

      console.log(`[Ingest] Extraction success. Length: ${fullText.length}. Generating context...`);

      const { text: contextHeader } = await generateText({
        model: google('gemini-3-flash-preview'),
        prompt: `Identify the institutional context of this document. Who is it for and what is the primary procedure/knowledge it conveys? Document: ${fullText.substring(0, 8000)}`,
      });

      console.log(`[Ingest] Context generated: ${contextHeader.substring(0, 50)}...`);

      const chunks = this.chunkText(fullText, 1000);
      const valuesToEmbed = chunks.map((chunk: string) => `[CONTEXT: ${contextHeader}] \n\n DATA: ${chunk}`);
      
      console.log(`[Ingest] Embedding ${chunks.length} chunks with Gemini Embedding 2 (3072 dims)...`);

      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('gemini-embedding-2-preview'),
        values: valuesToEmbed,
        providerOptions: {
          google: {
            outputDimensionality: 3072,
          }
        }
      });

      const rows = chunks.map((chunk: string, i: number) => ({
        blueprint_id: asset.blueprintId,
        content_type: asset.contentType,
        raw_content: chunk,
        contextual_header: contextHeader,
        embedding: embeddings[i],
        metadata: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(asset.metadata as any || {}),
          source_name: asset.fileName,
          chunk_index: i,
          total_chunks: chunks.length,
          processed_at: new Date().toISOString(),
        },
      }));

      console.log(`[Ingest] Storing ${rows.length} rows in Supabase...`);
      const { data, error } = await supabase.from('knowledge_vault').insert(rows).select();
      
      if (error) {
        console.error('[Ingest API Error]:', error);
        throw error;
      }
      
      console.log('[Ingest] Transaction Complete.');
      return { count: data ? data.length : 0, contextHeader };
    } catch (err) {
      console.error(`[Ingest Error] ${asset.fileName}:`, err);
      throw err;
    }
  }

  private async ingestMultimodalAsset(asset: IngestAsset) {
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mediaType: this.getMimeType(asset.contentType, asset.fileName) as any,
              },
            ],
          },
        ],
      });

      console.log(`[Ingest] Media analysis complete. Embedding description...`);

      const { embedding } = await embed({
        model: google.textEmbeddingModel('gemini-embedding-2-preview'),
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(asset.metadata as any || {}),
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
