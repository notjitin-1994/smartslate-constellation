import type { KnowledgeChunk } from '@/types/knowledge';

export interface MatchKnowledgeParams {
  queryEmbedding: number[];
  matchThreshold: number;
  matchCount: number;
  blueprintId: string;
  moduleId?: string | null;
}

export interface FallbackKnowledgeParams {
  blueprintId: string;
  moduleNum: string;
  limit: number;
}

export interface ChunkInsertRow {
  blueprint_id: string | null;
  user_id?: string | null;
  content_type: string;
  raw_content: string;
  contextual_header?: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

/**
 * Port: the domain's view of the knowledge vault storage layer.
 * Implementations hide Supabase details and connection management.
 */
export interface VaultPort {
  /** Throws if the vault is unreachable. */
  health(): Promise<void>;
  /** Semantic similarity search using the pre-built HNSW index. */
  matchKnowledge(params: MatchKnowledgeParams): Promise<KnowledgeChunk[]>;
  /** Metadata-based fallback when the vector search returns nothing. */
  fallbackKnowledge(params: FallbackKnowledgeParams): Promise<KnowledgeChunk[]>;
  /** Insert pre-embedded knowledge chunks into the vault. */
  insertChunks(rows: ChunkInsertRow[]): Promise<void>;
  /** Check whether a blueprint has already been harvested. */
  isBlueprintHarvested(blueprintId: string): Promise<boolean>;
}
