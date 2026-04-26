import { KnowledgeLedger } from '../../knowledge/entities/Knowledge';

export interface StoryboardResult {
  script: string;
  metadata: {
    groundingScore: number;
    auditLog: string[];
    deliverables: string[];
  };
}

export interface IConstellationOrchestrator {
  generateStoryboard(
    nodeTitle: string,
    nodeDescription: string,
    ledger: KnowledgeLedger,
    targetModality?: string
  ): Promise<StoryboardResult>;
  
  refineScene(
    currentScript: string,
    feedback: string,
    ledger: KnowledgeLedger
  ): Promise<StoryboardResult>;
}
