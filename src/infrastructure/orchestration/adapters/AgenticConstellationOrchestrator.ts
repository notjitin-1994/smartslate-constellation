import { generateText, generateObject } from 'ai';
import { google } from '@/lib/google';
import { z } from 'zod';
import { IConstellationOrchestrator, StoryboardResult } from '../../../domain/orchestration/interfaces/IOrchestrator';
import { KnowledgeLedger } from '../../../domain/knowledge/entities/Knowledge';

export class AgenticConstellationOrchestrator implements IConstellationOrchestrator {
  
  async generateStoryboard(
    nodeTitle: string, 
    nodeDescription: string, 
    ledger: KnowledgeLedger,
    targetModality?: string
  ): Promise<StoryboardResult> {
    console.log(`[Orchestrator] Orchestrating Constellation for: ${nodeTitle}`);

    // --- AGENT 1: CONSTELLATION MAPPER (The Architect) ---
    const { text: mappedFlow } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `You are the Constellation Mapper. Your role is to define the structural logic and pedagogical flow.
      ADHERE TO: Merrill's First Principles.
      CONSTRAINTS: ${ledger.master_blueprint_md}
      SOURCE FACTS: ${ledger.subject_matter_md}`,
      prompt: `TASK: Map out a high-fidelity instructional flow for "${nodeTitle}". 
      Description: ${nodeDescription}. Modality: ${targetModality || 'Blended'}.`
    });

    // --- AGENT 2: VISUAL STORYBOARDER (Brand Agnostic Artist) ---
    const { text: finalStoryboard } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `You are an elite Visual Storyboarder and Technical Art Director. 
      Your mission is to generate zero-ambiguity visual instructions for content developers.

      BRAND AGNOSTIC PROTOCOL:
      1. Do NOT use SmartSlate brand terms (Obsidian, Deep Space, Zen, Neural Network).
      2. Dynamically ADAPT to the Institutional Art Direction found in the Facts/Blueprint.
      3. If no specific brand direction is provided, use a "Universal Cinematic Professional" style (high contrast, depth of field, clear focal points).

      TECHNICAL STANDARDS:
      - [VISUAL]: Precise composition (Shot type, POV, Lighting, Color Palette). Describe exactly what is on-screen.
      - [VISUAL_PROMPT]: High-fidelity 4k prompt for image generation. Focus on photorealism, content accuracy, and cinematic quality.
      - [NARRATION]: Script-ready dialogue.
      - [ACTIVITY]: Interaction logic (e.g., "Clickable hotspot on the reactor core," "Drag-and-drop sequence for component A").
      - [BRANCHING]: Logical decision paths.
      - [SPEAKER_NOTES]: LIST ALL ASSETS REQUIRED (e.g., 3D models, specific UI sound effects, SVG icons, background WAV).`,
      prompt: `TASK: Based on this flow: ${mappedFlow}, generate the final storyboard for "${nodeTitle}".
      CROSS-REFERENCE: Every factual claim MUST include its source [Fact_ID].
      AMBIGUITY TARGET: 0%. The developer should not have to guess.`
    });

    // --- AGENT 3: INTEGRITY SENTINEL (The Auditor) ---
    const { object: audit } = await generateObject({
      model: google('gemini-3-flash-preview'),
      schema: z.object({
        groundingScore: z.number(),
        auditLog: z.array(z.string()),
        deliverables: z.array(z.string())
      }),
      system: `You are the Integrity Sentinel. Verify 100% groundedness in the facts and alignment with blueprint KPIs.`,
      prompt: `STORYBOARD:\n${finalStoryboard}\n\nBLUEPRINT:\n${ledger.master_blueprint_md}`
    });

    return {
      script: finalStoryboard,
      metadata: {
        groundingScore: audit.groundingScore,
        auditLog: audit.auditLog,
        deliverables: audit.deliverables
      }
    };
  }

  async refineScene(currentScript: string, feedback: string): Promise<StoryboardResult> {
    // Implementation for iterative refinement agent
    const { text: refinedScript } = await generateText({
      model: google('gemini-3.1-pro-preview'),
      system: `You are the Iterative Refiner. Perform surgical updates based on feedback.
      DO NOT rewrite the whole thing. Only change the relevant sections.`,
      prompt: `CURRENT_SCRIPT:\n${currentScript}\n\nFEEDBACK:\n${feedback}`
    });

    return {
      script: refinedScript,
      metadata: {
        groundingScore: 10,
        auditLog: ['Refinement completed.'],
        deliverables: []
      }
    };
  }
}
