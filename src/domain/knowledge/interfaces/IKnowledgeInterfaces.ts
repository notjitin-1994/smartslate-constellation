import { Fact, Constraint, KnowledgeLedger } from '../entities/Knowledge';

export interface IKnowledgeStore {
  saveLedger(ledger: KnowledgeLedger): Promise<void>;
  getLedger(blueprintId: string): Promise<KnowledgeLedger | null>;
  searchFacts(blueprintId: string, query: string): Promise<Fact[]>;
}

export interface IKnowledgeDistiller {
  distillBlueprint(blueprintJson: any): Promise<{
    masterMd: string;
    constraints: Constraint[];
  }>;
  distillSubjectMatter(content: string, sourceName: string): Promise<{
    facts: Fact[];
    subjectMatterMd: string;
  }>;
  generateAlignmentMap(blueprint: KnowledgeLedger): Promise<string>;
}
