import { IKnowledgeStore, IKnowledgeDistiller } from '../../../domain/knowledge/interfaces/IKnowledgeInterfaces';
import { KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

export class IngestBlueprintUseCase {
  constructor(
    private knowledgeStore: IKnowledgeStore,
    private knowledgeDistiller: IKnowledgeDistiller
  ) {}

  async execute(blueprintId: string, blueprintJson: Record<string, unknown>): Promise<KnowledgeLedger> {
    console.log(`[UseCase] Starting Ingestion for Blueprint: ${blueprintId}`);

    // 1. Distill the blueprint into the "Apex" Markdown and Constraints
    const { masterMd, constraints } = await this.knowledgeDistiller.distillBlueprint(blueprintJson);

    // 2. Check if a ledger already exists, or create a new one
    let ledger = await this.knowledgeStore.getLedger(blueprintId);
    
    if (!ledger) {
      ledger = {
        blueprint_id: blueprintId,
        master_blueprint_md: masterMd,
        subject_matter_md: '',
        strategic_alignment_md: '',
        facts: [],
        constraints: constraints
      };
    } else {
      // Update existing ledger
      ledger.master_blueprint_md = masterMd;
      ledger.constraints = constraints;
    }

    // 3. Persist the updated ledger
    await this.knowledgeStore.saveLedger(ledger);

    return ledger;
  }
}
