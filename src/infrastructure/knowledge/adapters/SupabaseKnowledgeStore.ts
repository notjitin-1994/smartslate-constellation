import { createAdminClient } from '@/lib/supabase';
import { embed, embedMany } from 'ai';
import { google } from '@/lib/google';
import { IKnowledgeStore } from '../../../domain/knowledge/interfaces/IKnowledgeInterfaces';
import { Fact, Constraint, KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

interface SupabaseFactRow {
  raw_content: string;
  metadata: {
    fact_id?: string;
    source_name?: string;
    confidence?: number;
    id_implications?: string;
    processed_at?: string;
  };
}

export class SupabaseKnowledgeStore implements IKnowledgeStore {
  private adminClient = createAdminClient();

  async saveLedger(ledger: KnowledgeLedger): Promise<void> {
    const { error: ledgerError } = await this.adminClient
      .from('knowledge_ledgers')
      .upsert({
        blueprint_id: ledger.blueprint_id,
        master_blueprint_md: ledger.master_blueprint_md,
        subject_matter_md: ledger.subject_matter_md,
        strategic_alignment_md: ledger.strategic_alignment_md,
        constraints: ledger.constraints,
        updated_at: new Date().toISOString()
      });

    if (ledgerError) throw ledgerError;

    if (ledger.facts.length > 0) {
      const valuesToEmbed = ledger.facts.map(f => `[FACT: ${f.id}] [SOURCE: ${f.source}] \n\n DATA: ${f.content}`);
      
      const { embeddings } = await embedMany({
        model: google.textEmbeddingModel('gemini-embedding-2'),
        values: valuesToEmbed,
        providerOptions: { google: { outputDimensionality: 3072 } }
      });

      const vaultRows = ledger.facts.map((f, i) => ({
        blueprint_id: ledger.blueprint_id,
        content_type: 'text',
        raw_content: f.content,
        embedding: embeddings[i],
        metadata: {
          fact_id: f.id,
          source_name: f.source,
          confidence: f.confidence,
          id_implications: f.id_implications,
          is_agentic_fact: true
        }
      }));

      const { error: vaultError } = await this.adminClient
        .from('knowledge_vault')
        .insert(vaultRows);

      if (vaultError) throw vaultError;
    }
  }

  async getLedger(blueprintId: string): Promise<KnowledgeLedger | null> {
    const { data, error } = await this.adminClient
      .from('knowledge_ledgers')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .single();

    if (error || !data) return null;

    return {
      blueprint_id: data.blueprint_id,
      master_blueprint_md: data.master_blueprint_md,
      subject_matter_md: data.subject_matter_md,
      strategic_alignment_md: data.strategic_alignment_md,
      facts: [],
      constraints: data.constraints as Constraint[]
    };
  }

  async searchFacts(blueprintId: string, query: string): Promise<Fact[]> {
    const { embedding } = await embed({
      model: google.textEmbeddingModel('gemini-embedding-2'),
      value: query,
    });

    const { data, error } = await this.adminClient.rpc('match_knowledge', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: 10,
      p_blueprint_id: blueprintId
    });

    if (error) throw error;

    return (data as SupabaseFactRow[]).map((d) => ({
      id: d.metadata?.fact_id || 'UNK',
      content: d.raw_content,
      source: d.metadata?.source_name || 'Legacy',
      confidence: d.metadata?.confidence || 1.0,
      id_implications: d.metadata?.id_implications,
      processed_at: d.metadata?.processed_at || new Date().toISOString()
    }));
  }
}
