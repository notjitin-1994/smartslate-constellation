import { generateText, generateObject } from 'ai';
import { google } from '@/lib/google';
import { z } from 'zod';
import { 
  IConstellationOrchestrator, 
  StoryboardResult, 
  InstructionalSchematic 
} from '../../../domain/orchestration/interfaces/IOrchestrator';
import { KnowledgeLedger, GlobalConstellationState } from '../../../domain/knowledge/entities/Knowledge';
import { InstructionalModalityRouter } from './InstructionalModalityRouter';
import { SupabaseKnowledgeStore } from '../../knowledge/adapters/SupabaseKnowledgeStore';
import { SupabaseStateStore } from './SupabaseStateStore';

export class AgenticConstellationOrchestrator implements IConstellationOrchestrator {
  
  async orchestrate(
    nodeId: string,
    nodeTitle: string, 
    nodeDescription: string, 
    ledger: KnowledgeLedger,
    state: GlobalConstellationState,
    targetModality?: string
  ): Promise<StoryboardResult> {
    console.log(`[Orchestrator] Starting Hierarchical Distillation with Gemini 3.1 Pro: ${nodeTitle}`);

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error('Instructional Engine Offline: GOOGLE_GENERATIVE_AI_API_KEY is missing in runtime environment.');
    }

    try {
      // --- PHASE 1.5: CONTEXTUAL RAG (Targeted Retrieval) ---
      const knowledgeStore = new SupabaseKnowledgeStore();
      const relevantFacts = await knowledgeStore.searchFacts(ledger.blueprint_id, `${nodeTitle} ${nodeDescription}`);
      
      // Filter out facts we've already used to prevent repetition
      const unusedFacts = relevantFacts.filter(f => !state.covered_fact_ids.includes(f.id));
      const contextLedger = unusedFacts.map(f => `[${f.id}] ${f.content}`).join('\n\n');

      // --- PRE-COMPUTE ROUTING ---
      const modalityRules = InstructionalModalityRouter.getModalityTemplate(targetModality);

      // --- PHASE 1: TACTICAL SCHEMATIC (The Architect) ---
      const { object: schematic } = await generateObject({
        model: google('gemini-3.1-pro-preview'),
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
        system: `You are the Lead Instructional Architect. Your goal is to map a tactical schematic for a specific node in the constellation.
        
        KNOWLEDGE LEDGER (Spend these facts carefully):
        ${contextLedger}
        
        CONSTELLATION MEMORY (Don't repeat what was already covered):
        ${state.narrative_arc}
        
        MODALITY CONSTRAINTS:
        ${modalityRules}
        
        RULES:
        - Mapping must be 100% grounded in the Ledger.
        - Strategic sections must follow the ${targetModality} modality requirements.
        - Ensure narrative continuity from previous nodes.`,
        prompt: `TASK: Map the tactical schematic for "${nodeTitle}": ${nodeDescription}`
      });

      // --- PHASE 2: CREATIVE RENDERING (The Artist) ---
      const { text: finalStoryboard } = await generateText({
        model: google('gemini-3.1-pro-preview'),
        system: `You are an elite Visual Storyboarder & Scriptwriter. 
        
        OUTPUT RULES:
        - Use ONLY the facts and logic defined in the Schematic: ${JSON.stringify(schematic)}
        - SCENE HEADERS: You MUST start every scene with "### Scene [Number]: [Title]". 
        - TAGS: Use exactly these tags: [VISUAL], [VISUAL_PROMPT], [NARRATION], [ACTIVITY], [BRANCHING], [SPEAKER_NOTES].
        - Formatting: Place the tag on one line, and the content on the lines below it.
        - BRAND AGNOSTIC: Adapt art direction to the "visual_direction" in the schematic.
        - 100% AMBIGUITY FREE: The content developer should not have to guess.`,
        prompt: `TASK: Render the full storyboard for "${nodeTitle}" based on the provided Schematic.`
      });

      // --- PHASE 3: INTEGRITY SENTINEL (The Auditor) ---
      const { object: audit } = await generateObject({
        model: google('gemini-1.5-flash-latest'),
        schema: z.object({
          groundingScore: z.number().min(0).max(10),
          hallucinationCount: z.number(),
          auditLog: z.array(z.string()),
          deliverables: z.array(z.string()),
          factsUsed: z.array(z.string())
        }),
        system: `You are the Integrity Sentinel. Your mission is to verify that the final Storyboard is 100% grounded.
        
        SCHEMATIC: ${JSON.stringify(schematic)}
        LEDGER: ${contextLedger}
        STORYBOARD: ${finalStoryboard}
        
        CRITICAL CHECK: If any fact or pedagogical goal from the schematic is missing or contradicted, flag it.`,
        prompt: `TASK: Perform a final integrity audit on the rendered storyboard.`
      });

      // --- PHASE 4: STATE SYNCHRONIZATION (The Memory) ---
      const updatedState: GlobalConstellationState = {
        ...state,
        covered_fact_ids: Array.from(new Set([...state.covered_fact_ids, ...audit.factsUsed])),
        narrative_arc: `${state.narrative_arc}\n\nNode ${nodeTitle} Completed: ${audit.auditLog[0] || 'Success'}`,
        previous_node_outputs: [
          ...state.previous_node_outputs,
          { node_id: nodeId, summary: audit.auditLog[0] || `Successfully mapped ${nodeTitle}` }
        ]
      };

      const stateStore = new SupabaseStateStore();
      await stateStore.saveState(updatedState);

      return {
        script: finalStoryboard,
        metadata: {
          groundingScore: audit.groundingScore,
          auditLog: audit.auditLog,
          deliverables: audit.deliverables,
          schematic: schematic,
          state: updatedState
        }
      };

    } catch (error) {
      const err = error as Error;
      console.error('[Constellation Orchestrator CRASH]:', err);
      throw new Error(`Orchestration Engine Failure: ${err.message}`);
    }
  }

  async refine(nodeId: string, currentScript: string, feedback: string, state: GlobalConstellationState): Promise<StoryboardResult> {
    const { text: refinedScript } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `You are the Refiner Agent. Update the script based on feedback while maintaining the existing Global State: ${JSON.stringify(state)}`,
      prompt: `CURRENT SCRIPT:\n${currentScript}\n\nFEEDBACK:\n${feedback}`
    });

    return {
      script: refinedScript,
      metadata: {
        groundingScore: 10,
        auditLog: ['Manual refinement applied.'],
        deliverables: [],
        state: state
      }
    };
  }
}
