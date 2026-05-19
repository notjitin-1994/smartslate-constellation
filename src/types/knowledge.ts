export type ContentType = 'text' | 'image' | 'video' | 'pdf' | 'docx';

export interface IngestAsset {
  blueprintId: string | null;
  userId?: string | null;
  contentType: ContentType;
  content: string;
  fileName: string;
  metadata?: Record<string, unknown>;
  blueprintContext?: Record<string, unknown> | null;
  useAdmin?: boolean;
}

export interface KnowledgeChunk {
  id: string;
  content_type: string;
  raw_content: string;
  media_url: string | null;
  metadata: Record<string, unknown>;
  similarity: number;
}
