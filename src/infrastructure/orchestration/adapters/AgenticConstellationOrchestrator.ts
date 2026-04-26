import { generateText, generateObject } from 'ai';
import { google } from '@/lib/google';
import { z } from 'zod';
import { 
  IConstellationOrchestrator, 
  StoryboardResult, 
  InstructionalSchematic 
} from '../../../domain/orchestration/interfaces/IOrchestrator';
import { KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

export class AgenticConstellationOrchestrator implements IConstellationOrchestrator {
  
  async orchestrate(
    nodeTitle: string, 
    nodeDescription: string, 
    ledger: KnowledgeLedger,
    targetModality?: string
  ): Promise<StoryboardResult> {
    console.log(`[Orchestrator] Starting Hierarchical Distillation with Gemini 3.1 Pro: ${nodeTitle}`);

    // Verify Model Key existence before trigger
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Instructional Engine Offline: GOOGLE_GENERATIVE_AI_API_KEY is missing in runtime environment.');
    }

    try {
      // --- PHASE 1: TACTICAL SCHEMATIC (The Architect) ---
      const { object: schematic } = await generateObject({
        model: google('gemini-3.1-pro-preview'), // UPGRADED TO 3.1 PRO
        schema: z.object({
          blueprint_id: z.string(),
          node_id: z.string(),
          pedagogical_model: z.enum(['Merrill', 'Gagne', 'Bloom']),
          global_context: z.string(),
          scenes: z.array(z.object({
            id: z.string(),
            pedagogical_goal: z.string(),
            fact_ids: z.array(z.string()),
            interaction_pattern: z.string(),
            visual_direction: z.string()
          })),
          kpi_alignment: z.array(z.string())
        }),
        system: `You are the Constellation Architect. Your role is to build a TACTICAL SCHEMATIC.
        MANDATE:
        1. Map the source facts to a logical learning trajectory.
        2. Adhere strictly to the Blueprint constraints: ${ledger.master_blueprint_md}
        3. Use Gagne's 9 Events or Merrill's Principles based on the node complexity.
        4. BIND every scene to specific [Fact_ID]s from the ledger: ${ledger.subject_matter_md}`,
        prompt: `TASK: Create a schematic for "${nodeTitle}" (${nodeDescription}). Target Modality: ${targetModality || 'Blended'}.`
      });

      // --- PHASE 2: CREATIVE RENDERING (The Artist) ---
      const { text: finalStoryboard } = await generateText({
        model: google('gemini-3.1-pro-preview'), // UPGRADED TO 3.1 PRO
        system: `You are an elite Visual Storyboarder & Scriptwriter. 
        
        OUTPUT RULES:
        - Use ONLY the facts and logic defined in the Schematic: ${JSON.stringify(schematic)}
        - Use exactly these tags: [VISUAL], [VISUAL_PROMPT], [NARRATION], [ACTIVITY], [BRANCHING], [SPEAKER_NOTES].
        - Each tag block MUST start on a NEW line. 
        - DO NOT put content on the same line as a tag (e.g., Use [VISUAL]\\nContent, NOT [VISUAL]: Content).
        - BRAND AGNOSTIC: Adapt art direction to the "visual_direction" in the schematic.
        - 100% AMBIGUITY FREE: The content developer should not have to guess.`,
        prompt: `TASK: Render the full storyboard for "${nodeTitle}" based on the provided Schematic.`
      });

      // --- PHASE 3: INTEGRITY SENTINEL (The Auditor) ---
      const { object: audit } = await generateObject({
        model: google('gemini-3-flash-preview'), // UPGRADED TO 3 FLASH
        schema: z.object({
          groundingScore: z.number(),
          auditLog: z.array(z.string()),
          deliverables: z.array(z.string())
        }),
        system: `You are the Integrity Sentinel. Your mission is to verify that the final Storyboard is 100% grounded.
        CHECKLIST:
        1. Are all [Fact_ID]s correctly cited?
        2. Does the [ACTIVITY] match the "interaction_pattern" in the schematic?
        3. Are the [VISUAL] specs brand-agnostic?`,
        prompt: `STORYBOARD:\n${finalStoryboard}\n\nSCHEMATIC:\n${JSON.stringify(schematic)}\n\nBLUEPRINT:\n${ledger.master_blueprint_md}`
      });

      return {
        script: finalStoryboard,
        metadata: {
          groundingScore: audit.groundingScore,
          auditLog: audit.auditLog,
          deliverables: audit.deliverables,
          schematic: (schematic as unknown as InstructionalSchematic)
        }
      };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[Orchestrator Engine Crash]:', err);
      throw new Error(`Orchestration Engine failed: ${err.message}`);
    }
  }

  async refine(currentScript: string, feedback: string, ledger: KnowledgeLedger): Promise<StoryboardResult> {
    const { text: refinedScript } = await generateText({
      model: google('gemini-3.1-pro-preview'), // UPGRADED TO 3.1 PRO
      system: `You are the Iterative Refinement Agent. 
      TASK: Perform a SURGICAL update to the script based on user feedback.
      RULE: Do not change unaffected sections. Maintain [Fact_ID] anchors.
      LEDGER: ${ledger.master_blueprint_md}`,
      prompt: `CURRENT_SCRIPT:\n${currentScript}\n\nFEEDBACK:\n${feedback}`
    });

    return {
      script: refinedScript,
      metadata: {
        groundingScore: 10,
        auditLog: ['Manual refinement applied.'],
        deliverables: []
      }
    };
  }
}
