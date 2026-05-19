/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateText as sdkGenerateText } from 'ai';
import { google, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from '@/lib/google';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';
import { z } from 'zod';
import { withRetry } from '@/lib/retry';
import { createLogger, type Logger } from '@/lib/logger';
import { chunkText } from '@/lib/chunking';
import type { LlmPort } from '@/ports/LlmPort';
import type { VaultPort, ChunkInsertRow } from '@/ports/VaultPort';
import type { ContentType, IngestAsset } from '@/types/knowledge';
import { geminiLlmAdapter } from '@/adapters/gemini/GeminiLlmAdapter';
import { supabaseVaultAdapter } from '@/adapters/supabase/SupabaseVaultAdapter';

export type { ContentType, IngestAsset };

// Maximum chars passed to the LLM for module-content segregation.
// ~200k chars ≈ 50k tokens — within Gemini Flash's context window.
// Documents exceeding this fall back to generic chunking without LLM segregation.
const SEGREGATION_CHAR_LIMIT = 200_000;

const SegregationSchema = z.object({
  contextHeader: z
    .string()
    .describe(
      'Overall institutional context of the document. Who is it for and what procedure/knowledge it conveys?'
    ),
  moduleContents: z.array(
    z.object({
      moduleId: z.string().describe('Module ID, e.g. NODE_01'),
      relevantContent: z
        .string()
        .describe(
          'All extracted text relevant to this module. Empty string if none.'
        ),
    })
  ),
});

export class KnowledgeIngestService {
  constructor(
    private readonly llm: LlmPort,
    private readonly vault: VaultPort
  ) {}

  async ingest(asset: IngestAsset) {
    const log = createLogger();
    log.info('ingest.start', { fileName: asset.fileName, contentType: asset.contentType });
    if (['pdf', 'text', 'docx'].includes(asset.contentType)) {
      return this.ingestDocument(asset, log);
    }
    return this.ingestMultimodalAsset(asset, log);
  }

  async harvestBlueprint(blueprintId: string, blueprintJson: any) {
    const log = createLogger();
    log.info('harvest.start', { blueprintId });

    try {
      if (await this.vault.isBlueprintHarvested(blueprintId)) {
        log.info('harvest.skip — already harvested');
        return;
      }

      const blueprintFacts = await this.llm.generateText({
        model: 'gemini-3.1-pro-preview',
        system: `You are an expert Strategic Data Harvester.
Extract every verifiable metric, rule, and requirement from the Blueprint JSON.
Capture:
- Target Audience Details (roles, levels, demographics)
- Delivery & Technical Config (SCORM, LMS, Vimeo, etc.)
- Program Metrics (durations, passing scores, assessment counts)
Output as a granular numbered list of core institutional facts.`,
        prompt: `BLUEPRINT_JSON:\n${JSON.stringify(blueprintJson)}`,
      });

      const chunks = chunkText(blueprintFacts);
      const valuesToEmbed = chunks.map(
        (chunk) => `[STRATEGIC_BLUEPRINT]\n\nDATA: ${chunk}`
      );

      log.info('harvest.embedding', { chunkCount: chunks.length });
      const embeddings = await this.llm.embedMany({
        model: EMBEDDING_MODEL,
        values: valuesToEmbed,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      });

      const rows: ChunkInsertRow[] = chunks.map((chunk, i) => ({
        blueprint_id: blueprintId,
        content_type: 'text',
        raw_content: chunk,
        contextual_header: 'Strategic Blueprint Core Data',
        embedding: embeddings[i],
        metadata: {
          source_name: 'POLARIS_BLUEPRINT',
          is_blueprint_source: true,
          chunk_index: i,
          total_chunks: chunks.length,
          processed_at: new Date().toISOString(),
        },
      }));

      await this.vault.insertChunks(rows);
      log.info('harvest.complete', { rowCount: rows.length });
    } catch (err) {
      log.error('harvest.error', { err: String(err) });
    }
  }

  private async ingestDocument(asset: IngestAsset, log: Logger) {
    let fullText = '';

    if (asset.contentType === 'pdf') {
      log.info('doc.extract.pdf');
      const buffer = Buffer.from(asset.content, 'base64');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      fullText = result.text;
    } else if (asset.contentType === 'docx') {
      log.info('doc.extract.docx');
      const buffer = Buffer.from(asset.content, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      fullText = result.value;
    } else {
      fullText = asset.content;
    }

    if (!fullText || !fullText.trim()) {
      throw new Error('Document extraction returned empty text.');
    }

    log.info('doc.extracted', { charCount: fullText.length, fileName: asset.fileName });

    const bpContext: any = asset.blueprintContext;
    const modulesListStr = bpContext?.content_outline?.modules
      ? bpContext.content_outline.modules
          .map(
            (m: { title: string; description: string }, i: number) =>
              `ID: NODE_0${i + 1} | Title: ${m.title} | Desc: ${m.description}`
          )
          .join('\n')
      : 'No modules available. Use generic ingestion.';

    const rows: ChunkInsertRow[] = [];

    if (fullText.length <= SEGREGATION_CHAR_LIMIT) {
      // LLM-based module segregation
      log.info('doc.segregate.llm');
      const segregation = await this.llm.generateObject({
        model: 'gemini-3-flash-preview',
        schema: SegregationSchema,
        prompt: `You are an expert instructional design data parser. Segregate the document content by module.
A document may contain content for multiple modules — assign each section to the most relevant module.

Modules:\n${modulesListStr}

Document:\n${fullText}`,
      });

      log.info('doc.segregated', { contextHeader: segregation.contextHeader.slice(0, 60) });

      for (const mc of segregation.moduleContents) {
        if (!mc.relevantContent?.trim()) continue;
        const moduleChunks = chunkText(mc.relevantContent);
        if (moduleChunks.length === 0) continue;

        log.info('doc.embed.module', { moduleId: mc.moduleId, chunkCount: moduleChunks.length });
        const valuesToEmbed = moduleChunks.map(
          (chunk) => `[MODULE: ${mc.moduleId}] [CONTEXT: ${segregation.contextHeader}]\n\nDATA: ${chunk}`
        );

        const embeddings = await this.llm.embedMany({
          model: EMBEDDING_MODEL,
          values: valuesToEmbed,
          outputDimensionality: EMBEDDING_DIMENSIONS,
        });

        rows.push(
          ...moduleChunks.map((chunk, i) => ({
            blueprint_id: asset.blueprintId,
            user_id: asset.userId,
            content_type: asset.contentType,
            raw_content: chunk,
            contextual_header: segregation.contextHeader,
            embedding: embeddings[i],
            metadata: {
              ...(asset.metadata || {}),
              source_name: asset.fileName,
              module_id: mc.moduleId,
              chunk_index: i,
              total_chunks: moduleChunks.length,
              processed_at: new Date().toISOString(),
            },
          }))
        );
      }

      // If LLM returned no content, fall back to generic chunking
      if (rows.length === 0) {
        log.warn('doc.segregate.empty — falling back to generic chunking');
        const fallback = await this.buildEmbeddedRows(fullText, segregation.contextHeader, asset, log);
        rows.push(...fallback);
      }
    } else {
      // Document exceeds segregation limit — chunk directly without LLM
      log.info('doc.segregate.generic', { reason: 'document exceeds segregation limit', charCount: fullText.length });
      const generic = await this.buildEmbeddedRows(fullText, asset.fileName, asset, log);
      rows.push(...generic);
    }

    if (rows.length > 0) {
      log.info('doc.insert', { rowCount: rows.length });
      await this.vault.insertChunks(rows);
    }

    log.info('doc.complete', { rowCount: rows.length });
    return { count: rows.length };
  }

  private async buildEmbeddedRows(
    text: string,
    contextHeader: string,
    asset: IngestAsset,
    log: Logger
  ): Promise<ChunkInsertRow[]> {
    const chunks = chunkText(text);
    if (chunks.length === 0) return [];

    log.info('doc.embed.generic', { chunkCount: chunks.length });
    const valuesToEmbed = chunks.map((c) => `[CONTEXT: ${contextHeader}]\n\nDATA: ${c}`);
    const embeddings = await this.llm.embedMany({
      model: EMBEDDING_MODEL,
      values: valuesToEmbed,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });

    return chunks.map((chunk, i) => ({
      blueprint_id: asset.blueprintId,
      user_id: asset.userId,
      content_type: asset.contentType,
      raw_content: chunk,
      contextual_header: contextHeader,
      embedding: embeddings[i],
      metadata: {
        ...(asset.metadata || {}),
        source_name: asset.fileName,
        chunk_index: i,
        total_chunks: chunks.length,
        processed_at: new Date().toISOString(),
      },
    }));
  }

  private async ingestMultimodalAsset(asset: IngestAsset, log: Logger) {
    log.info('multimodal.start', { fileName: asset.fileName, contentType: asset.contentType });

    // multimodal messages use provider-specific 'file' content type — kept here intentionally
    const { text: description } = await withRetry(() =>
      sdkGenerateText({
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
                mediaType: this.getMimeType(
                  asset.contentType,
                  asset.fileName
                ) as 'image/png' | 'image/jpeg' | 'video/mp4',
              },
            ],
          },
        ],
      })
    );

    log.info('multimodal.described', { descriptionLength: description.length });

    const embedding = await this.llm.embed({
      model: EMBEDDING_MODEL,
      value: description,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });

    await this.vault.insertChunks([
      {
        blueprint_id: asset.blueprintId,
        user_id: asset.userId,
        content_type: asset.contentType,
        raw_content: description,
        embedding,
        metadata: {
          ...(asset.metadata || {}),
          source_name: asset.fileName,
          is_multimodal: true,
          processed_at: new Date().toISOString(),
        },
      },
    ]);

    log.info('multimodal.complete');
    return { count: 1 };
  }

  private getMimeType(type: string, fileName: string): string {
    if (type === 'image') return fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
    if (type === 'video') return 'video/mp4';
    if (type === 'pdf') return 'application/pdf';
    if (type === 'docx')
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    return 'text/plain';
  }
}

// Default singleton wired to real adapters
export const knowledgeIngestService = new KnowledgeIngestService(
  geminiLlmAdapter,
  supabaseVaultAdapter
);
