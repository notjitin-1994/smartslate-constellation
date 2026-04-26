import { createAdminClient } from '@/lib/supabase';
import { GlobalConstellationState } from '../../../domain/knowledge/entities/Knowledge';

export class SupabaseStateStore {
  private adminClient = createAdminClient();

  async getState(blueprintId: string): Promise<GlobalConstellationState> {
    const { data, error } = await this.adminClient
      .from('constellation_states')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[StateStore] Error fetching state:', error);
      throw error;
    }

    if (!data) {
      return {
        blueprint_id: blueprintId,
        covered_fact_ids: [],
        narrative_arc: 'Initial state. No narrative progression established yet.',
        previous_node_outputs: []
      };
    }

    return {
      blueprint_id: data.blueprint_id,
      covered_fact_ids: data.metadata?.covered_fact_ids || [],
      narrative_arc: data.metadata?.narrative_arc || 'Initial state. No narrative progression established yet.',
      previous_node_outputs: data.metadata?.previous_node_outputs || []
    };
  }

  async saveState(state: GlobalConstellationState): Promise<void> {
    const { error } = await this.adminClient
      .from('constellation_states')
      .upsert({
        blueprint_id: state.blueprint_id,
        metadata: {
          covered_fact_ids: state.covered_fact_ids,
          narrative_arc: state.narrative_arc,
          previous_node_outputs: state.previous_node_outputs
        },
        updated_at: new Date().toISOString()
      }, { onConflict: 'blueprint_id' });

    if (error) {
      console.error('[StateStore] Error saving state:', error);
      throw error;
    }
  }
}
