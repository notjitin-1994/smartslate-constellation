import { generateText, generateObject } from 'ai';
import { google } from '@/lib/google';
import { z } from 'zod';
import { IKnowledgeDistiller } from '../../../domain/knowledge/interfaces/IKnowledgeInterfaces';
import { Fact, Constraint, KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

export class GeminiKnowledgeDistiller implements IKnowledgeDistiller {
  async distillBlueprint(blueprintJson: Record<string, unknown>): Promise<{ masterMd: string; constraints: Constraint[] }> {
    const { object } = await generateObject({
      model: google('gemini-3.1-pro-preview'),
      schema: z.object({
        masterMd: z.string().describe('A high-fidelity markdown summary of the blueprint constraints.'),
        constraints: z.array(z.object({
          category: z.enum(['DEMOGRAPHIC', 'TIMELINE', 'KPI', 'TOOL', 'ACCESSIBILITY']),
          requirement: z.string(),
          impact_level: z.enum(['HIGH', 'MEDIUM', 'LOW']),
          source_id: z.string()
        }))
      }),
      system: `You are an elite Strategic Data Harvester. Extract every metric and rule from the Blueprint.
      Include specific sections for Audience, Platform, Accessibility, and KPIs in the Markdown.`,
      prompt: `BLUEPRINT_JSON:\n${JSON.stringify(blueprintJson)}`
    });

    return object;
  }

  async distillSubjectMatter(content: string, sourceName: string): Promise<{ facts: Fact[]; subjectMatterMd: string }> {
    const { object } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: z.object({
        subjectMatterMd: z.string().describe('Structured markdown version of the user data.'),
        facts: z.array(z.object({
          id: z.string(),
          content: z.string(),
          source: z.string(),
          confidence: z.number(),
          id_implications: z.string().optional()
        }))
      }),
      system: `You are a Strict Knowledge Harvester. Extract atomic facts and convert raw data to structured markdown.
      Assign each fact a unique ID like [FACT_01].`,
      prompt: `SOURCE_NAME: ${sourceName}\nCONTENT:\n${content}`
    });

    const facts: Fact[] = object.facts.map(f => ({
      ...f,
      processed_at: new Date().toISOString()
    }));

    return { facts, subjectMatterMd: object.subjectMatterMd };
  }

  async generateAlignmentMap(ledger: KnowledgeLedger): Promise<string> {
    const { text } = await generateText({
      model: google('gemini-3-flash-preview'),
      system: `You are a Strategic Auditor. Compare the Blueprint Constraints with the Subject Matter Facts.
      Identify which facts satisfy which constraints and highlight any gaps.`,
      prompt: `BLUEPRINT_MASTER:\n${ledger.master_blueprint_md}\n\nFACT_LEDGER:\n${ledger.subject_matter_md}`
    });
    return text;
  }
}
