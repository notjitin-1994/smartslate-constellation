import { KnowledgeLedger, GlobalConstellationState } from '../../knowledge/entities/Knowledge';

export interface InstructionalSchematic {
  blueprint_id: string;
  node_id: string;
  pedagogical_model: 'Merrill' | 'Gagne' | 'Bloom';
  global_context: string;
  scenes: {
    id: string;
    pedagogical_goal: string;
    fact_ids: string[]; // Explicit binding to [FACT_01], etc.
    interaction_pattern: string;
    visual_direction: string;
  }[];
  kpi_alignment: string[];
}

export interface StoryboardResult {
  script: string;
  metadata: {
    groundingScore: number;
    auditLog: string[];
    deliverables: string[];
    schematic?: InstructionalSchematic;
    state?: GlobalConstellationState;
  };
}

export interface IConstellationOrchestrator {
  /**
   * Phase 1 & 2: Generate the tactical logic then render the creative script.
   */
  orchestrate(
    nodeId: string,
    nodeTitle: string,
    nodeDescription: string,
    ledger: KnowledgeLedger,
    state: GlobalConstellationState,
    targetModality?: string
  ): Promise<StoryboardResult>;

  /**
   * Phase 3: Surgical refinement of a specific scene/flow.
   */
  refine(
    currentScript: string,
    feedback: string,
    ledger: KnowledgeLedger,
    state: GlobalConstellationState
  ): Promise<StoryboardResult>;
}
