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
    if (['pdf', 'text', 'docx'].includes(asset.contentType)) {
      return this.ingestDocument(asset);
    } else {
      return this.ingestMultimodalAsset(asset);
    }
  }

  private async ingestDocument(asset: IngestAsset) {
    let fullText = '';

    if (asset.contentType === 'pdf') {
      const buffer = Buffer.from(asset.content, 'base64');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      fullText = result.text;
    } else if (asset.contentType === 'docx') {
      const buffer = Buffer.from(asset.content, 'base64');
      const result = await mammoth.extractRawText({ buffer });
      fullText = result.value;
    } else {
      fullText = asset.content;
    }

    const { text: contextHeader } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `Identify the institutional context of this document. Who is it for and what is the primary procedure/knowledge it conveys? Document: ${fullText.substring(0, 8000)}`,
    });

    const chunks = this.chunkText(fullText, 1000);
    const valuesToEmbed = chunks.map((chunk: string) => `[CONTEXT: ${contextHeader}] \n\n DATA: ${chunk}`);
    
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      values: valuesToEmbed,
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

    const { data, error } = await supabase.from('knowledge_vault').insert(rows).select();
    if (error) throw error;
    return { count: data ? data.length : 0, contextHeader };
  }

  private async ingestMultimodalAsset(asset: IngestAsset) {
    const { text: description } = await generateText({
      model: google('gemini-2.5-flash'),
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
              mediaType: this.getMimeType(asset.contentType, asset.fileName),
            },
          ],
        },
      ],
    });

    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-001'),
      value: description,
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

    if (error) throw error;
    return data;
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
