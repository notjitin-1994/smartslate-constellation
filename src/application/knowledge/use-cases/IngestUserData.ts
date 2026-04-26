import { IKnowledgeStore, IKnowledgeDistiller } from '../../../domain/knowledge/interfaces/IKnowledgeInterfaces';
import { KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

export class IngestUserDataUseCase {
  constructor(
    private knowledgeStore: IKnowledgeStore,
    private knowledgeDistiller: IKnowledgeDistiller
  ) {}

  async execute(blueprintId: string, content: string, sourceName: string): Promise<KnowledgeLedger> {
    console.log(`[UseCase] Distilling User Data for Blueprint: ${blueprintId}`);

    // 1. Fetch current ledger or fail if blueprint not ingested yet
    let ledger = await this.knowledgeStore.getLedger(blueprintId);
    if (!ledger) {
      throw new Error('Strategic Blueprint must be ingested before user data.');
    }

    // 2. Distill the user content into Facts and Subject Matter Markdown
    const { facts, subjectMatterMd } = await this.knowledgeDistiller.distillSubjectMatter(content, sourceName);

    // 3. Update the ledger
    // Append or overwrite? For now, we'll overwrite subject_matter_md with structured aggregation
    // In a real multi-agent system, we might aggregate across multiple files
    ledger.subject_matter_md = subjectMatterMd;
    ledger.facts = facts;

    // 4. Generate the Strategic Alignment Map (Gap Analysis)
    const alignmentMap = await this.knowledgeDistiller.generateAlignmentMap(ledger);
    ledger.strategic_alignment_md = alignmentMap;

    // 5. Persist the updated ledger and facts
    await this.knowledgeStore.saveLedger(ledger);

    return ledger;
  }
}
