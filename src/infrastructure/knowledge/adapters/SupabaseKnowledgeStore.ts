import { createAdminClient } from '@/lib/supabase';
import { embed, embedMany } from 'ai';
import { google } from '@/lib/google';
import { IKnowledgeStore } from '../../../domain/knowledge/interfaces/IKnowledgeInterfaces';
import { Fact, Constraint, KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';
import { SupabaseClient } from '@supabase/supabase-js';

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
  private _adminClient: SupabaseClient | null = null;

  private get adminClient() {
    if (!this._adminClient) {
      this._adminClient = createAdminClient();
    }
    return this._adminClient;
  }

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
      const BATCH_SIZE = 50;
      const valuesToEmbed = ledger.facts.map(f => `[FACT: ${f.id}] [SOURCE: ${f.source}] \n\n DATA: ${f.content}`);
      
      let allEmbeddings: number[][] = [];
      
      for (let i = 0; i < valuesToEmbed.length; i += BATCH_SIZE) {
        const batch = valuesToEmbed.slice(i, i + BATCH_SIZE);
        const { embeddings } = await embedMany({
          model: google.textEmbeddingModel('gemini-embedding-2'),
          values: batch,
          providerOptions: { google: { outputDimensionality: 3072 } }
        });
        allEmbeddings = allEmbeddings.concat(embeddings);
      }

      const vaultRows = ledger.facts.map((f, i) => ({
        blueprint_id: ledger.blueprint_id,
        content_type: 'text',
        raw_content: f.content,
        embedding: allEmbeddings[i],
        metadata: {
          fact_id: f.id,
          source_name: f.source,
          confidence: f.confidence,
          id_implications: f.id_implications,
          is_agentic_fact: true
        }
      }));

      // Insert in batches to avoid Supabase payload limits
      for (let i = 0; i < vaultRows.length; i += BATCH_SIZE) {
        const batchRows = vaultRows.slice(i, i + BATCH_SIZE);
        const { error: vaultError } = await this.adminClient
          .from('knowledge_vault')
          .insert(batchRows);

        if (vaultError) throw vaultError;
      }
    }
  }

  async getLedger(blueprintId: string): Promise<KnowledgeLedger | null> {
    const { data, error } = await this.adminClient
      .from('knowledge_ledgers')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error; // Throw real errors (network, permissions, etc.)
    }
    
    if (!data) return null;

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
