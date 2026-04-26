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
    const ledger = await this.knowledgeStore.getLedger(blueprintId);
    if (!ledger) {
      throw new Error('Strategic Blueprint must be ingested before user data.');
    }

    // 2. Distill the user content into Facts and Subject Matter Markdown
    const { facts, subjectMatterMd } = await this.knowledgeDistiller.distillSubjectMatter(content, sourceName);

    // 3. Update the ledger
    // Append the new markdown to the existing subject_matter_md with a divider
    const newMarkdown = `### Source: ${sourceName}\n\n${subjectMatterMd}`;
    ledger.subject_matter_md = ledger.subject_matter_md 
      ? `${ledger.subject_matter_md}\n\n---\n\n${newMarkdown}` 
      : newMarkdown;
      
    // Append the new facts to the existing facts array
    ledger.facts = [...(ledger.facts || []), ...facts];

    // 4. Generate the Strategic Alignment Map (Gap Analysis)
    const alignmentMap = await this.knowledgeDistiller.generateAlignmentMap(ledger);
    ledger.strategic_alignment_md = alignmentMap;

    // 5. Persist the updated ledger and facts
    await this.knowledgeStore.saveLedger(ledger);

    return ledger;
  }
}
