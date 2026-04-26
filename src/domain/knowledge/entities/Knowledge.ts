export interface Fact {
  id: string; // e.g., [FACT_01]
  content: string;
  source: string;
  confidence: number; // 0.0 - 1.0
  id_implications?: string; // Instructional Design specific notes
  processed_at: string;
}

export interface Constraint {
  category: 'DEMOGRAPHIC' | 'TIMELINE' | 'KPI' | 'TOOL' | 'ACCESSIBILITY';
  requirement: string;
  impact_level: 'HIGH' | 'MEDIUM' | 'LOW';
  source_id: string;
}

export interface KnowledgeLedger {
  blueprint_id: string;
  master_blueprint_md: string;
  subject_matter_md: string;
  strategic_alignment_md: string;
  facts: Fact[];
  constraints: Constraint[];
}
