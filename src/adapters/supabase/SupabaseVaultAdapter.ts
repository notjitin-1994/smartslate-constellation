import { createAdminClient } from '@/lib/supabase';
import type { VaultPort, MatchKnowledgeParams, FallbackKnowledgeParams, ChunkInsertRow } from '@/ports/VaultPort';
import type { KnowledgeChunk } from '@/types/knowledge';

export class SupabaseVaultAdapter implements VaultPort {
  // Getter so the client is created fresh per call (avoids module-load-time browser check)
  private get client() {
    return createAdminClient();
  }

  async health(): Promise<void> {
    const { error } = await this.client.from('knowledge_vault').select('id').limit(1);
    if (error) throw new Error(`Vault health check failed: ${error.message}`);
  }

  async matchKnowledge(params: MatchKnowledgeParams): Promise<KnowledgeChunk[]> {
    const { data, error } = await this.client.rpc('match_knowledge', {
      query_embedding: params.queryEmbedding,
      match_threshold: params.matchThreshold,
      match_count: params.matchCount,
      p_blueprint_id: params.blueprintId,
      p_module_id: params.moduleId ?? null,
    });

    if (error) throw new Error(`match_knowledge RPC failed: ${error.message}`);
    return (data ?? []) as KnowledgeChunk[];
  }

  async fallbackKnowledge(params: FallbackKnowledgeParams): Promise<KnowledgeChunk[]> {
    const { data, error } = await this.client
      .from('knowledge_vault')
      .select('id, content_type, raw_content, media_url, metadata')
      .eq('blueprint_id', params.blueprintId)
      .or(
        `metadata->>source_name.ilike.%M${params.moduleNum}%,` +
          `metadata->>source_name.ilike.%Module ${params.moduleNum}%,` +
          `metadata->>source_name.eq.POLARIS_BLUEPRINT`
      )
      .limit(params.limit);

    if (error) throw new Error(`Vault fallback query failed: ${error.message}`);
    return (data ?? []) as KnowledgeChunk[];
  }

  async insertChunks(rows: ChunkInsertRow[]): Promise<void> {
    if (rows.length === 0) return;
    const { error } = await this.client.from('knowledge_vault').insert(rows);
    if (error) throw new Error(`Vault insert failed: ${error.message}`);
  }

  async isBlueprintHarvested(blueprintId: string): Promise<boolean> {
    const { count } = await this.client
      .from('knowledge_vault')
      .select('*', { count: 'exact', head: true })
      .eq('blueprint_id', blueprintId)
      .eq('content_type', 'text')
      .contains('metadata', { is_blueprint_source: true });

    return (count ?? 0) > 0;
  }
}

export const supabaseVaultAdapter = new SupabaseVaultAdapter();
