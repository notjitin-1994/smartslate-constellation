import { createAdminClient } from '@/lib/supabase';
import { GlobalConstellationState } from '../../../domain/knowledge/entities/Knowledge';

export class SupabaseStateStore {
  private adminClient = createAdminClient();

  async getState(blueprintId: string): Promise<GlobalConstellationState> {
    const { data, error } = await this.adminClient
      .from('knowledge_ledgers')
      .select('global_state')
      .eq('blueprint_id', blueprintId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[StateStore] Error fetching state:', error);
      throw error;
    }

    if (!data || !data.global_state || typeof data.global_state !== 'object') {
      return {
        blueprint_id: blueprintId,
        covered_fact_ids: [],
        narrative_arc: 'Initial state. No narrative progression established yet.',
        previous_node_outputs: []
      };
    }

    const state = data.global_state as Record<string, unknown>;

    return {
      blueprint_id: blueprintId,
      covered_fact_ids: (state.covered_fact_ids as string[]) || [],
      narrative_arc: (state.narrative_arc as string) || 'Initial state. No narrative progression established yet.',
      previous_node_outputs: (state.previous_node_outputs as { node_id: string; summary: string; }[]) || []
    };
  }

  async saveState(state: GlobalConstellationState): Promise<void> {
    // Robust Upsert for State persistence
    const { error } = await this.adminClient
      .from('knowledge_ledgers')
      .upsert({
        blueprint_id: state.blueprint_id,
        global_state: {
          covered_fact_ids: state.covered_fact_ids,
          narrative_arc: state.narrative_arc,
          previous_node_outputs: state.previous_node_outputs
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'blueprint_id' });

    if (error) {
      console.error('[StateStore] FATAL Error saving state:', error);
      throw new Error(`State Persistence Failure: ${error.message}`);
    }
  }
}
