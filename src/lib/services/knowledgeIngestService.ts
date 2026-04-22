import { supabase } from '@/lib/supabase';
import { generateText, embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';
import { extractText, getDocumentProxy } from 'unpdf';
import mammoth from 'mammoth';

export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string;
  contentType: ContentType;
  content: string; // Base64 for media/docs or raw text
  fileName: string;
  metadata?: any;
}

export class KnowledgeIngestService {
  /**
   * Processes an asset with Contextual RAG pattern.
   * Gemini 2.0 handles the "understanding" across all modalities.
   */
  async ingest(asset: IngestAsset) {
    if (['pdf', 'text', 'docx'].includes(asset.contentType)) {
      return this.ingestDocument(asset);
    } else {
      return this.ingestMultimodalAsset(asset);
    }
  }

  /**
   * Logic for Text, PDF, and DOCX: Structural Extraction -> Contextual Retrieval Prepend
   */
  private async ingestDocument(asset: IngestAsset) {
    let fullText = '';

    // Step 1: High-Speed Extraction
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

    // Step 2: Generate Institutional Context (The "Why" of the doc)
    const { text: contextHeader } = await generateText({
      model: google('gemini-1.5-flash-exp'),
      prompt: `Identify the institutional context of this document. Who is it for and what is the primary procedure/knowledge it conveys? Keep it to 2 sentences. Document: ${fullText.substring(0, 8000)}`,
    });

    // Step 3: Semantic Chunking
    const chunks = this.chunkText(fullText, 1000);
    
    // Step 4: Parallel Contextual Embedding
    const valuesToEmbed = chunks.map(chunk => `[DOCUMENT CONTEXT: ${contextHeader}] \n\n DATA: ${chunk}`);
    
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel('text-embedding-004'),
      values: valuesToEmbed,
    });

    // Step 5: Batch Store
    const rows = chunks.map((chunk, i) => ({
      blueprint_id: asset.blueprintId,
      content_type: asset.contentType,
      raw_content: chunk,
      contextual_header: contextHeader,
      embedding: embeddings[i],
      metadata: {
        ...asset.metadata,
        source_name: asset.fileName,
        chunk_index: i,
        total_chunks: chunks.length,
        processed_at: new Date().toISOString(),
      },
    }));

    const { data, error } = await supabase.from('knowledge_vault').insert(rows).select();
    if (error) throw error;
    return { count: data.length, contextHeader };
  }

  /**
   * Logic for Images and Videos: Gemini 2.0 Vision Analysis -> Textual Grounding
   */
  private async ingestMultimodalAsset(asset: IngestAsset) {
    // Gemini 2.0 Flash is uniquely capable of "watching" the video/image and 
    // summarizing it for instructional design.
    const { text: description } = await generateText({
      model: google('gemini-2.0-flash-exp'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this ${asset.contentType} (e.g., Loom video or Technical Image). 
              Generate a high-fidelity transcript and visual summary for a Generative Learning Architect. 
              MANDATORY: Focus on UI interactions, technical steps, and organizational wisdom.`,
            },
            {
              type: 'file',
              data: asset.content,
              mimeType: this.getMimeType(asset.contentType, asset.fileName),
            } as any,
          ],
        },
      ],
    });

    const { embedding } = await embed({
      model: google.textEmbeddingModel('text-embedding-004'),
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
          ...asset.metadata,
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
