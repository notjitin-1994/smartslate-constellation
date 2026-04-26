import { KnowledgeLedger } from '../../knowledge/entities/Knowledge';

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
  };
}

export interface IConstellationOrchestrator {
  /**
   * Phase 1 & 2: Generate the tactical logic then render the creative script.
   */
  orchestrate(
    nodeTitle: string,
    nodeDescription: string,
    ledger: KnowledgeLedger,
    targetModality?: string
  ): Promise<StoryboardResult>;

  /**
   * Phase 3: Surgical refinement of a specific scene/flow.
   */
  refine(
    currentScript: string,
    feedback: string,
    ledger: KnowledgeLedger
  ): Promise<StoryboardResult>;
}
