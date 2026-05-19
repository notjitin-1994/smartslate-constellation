import { z } from 'zod';

export const VisualSpec = z.object({
  artDirection: z.string().describe("Elite director's shot description — composition, focal point, instructional purpose"),
  generationPrompt: z.string().describe("Self-contained 4K image generation prompt for Nano Banana Pro. Never mention Deep Space, Zen, Obsidian, Neural Network, Glow, Constellation, or Teal accents."),
});

export const Scene = z.object({
  id: z.string().describe("Short kebab-case identifier, e.g. scene-01"),
  title: z.string().describe("Scene label, e.g. 'Scene 1: The Problem Statement'"),
  narration: z.string().describe("Verbatim spoken narration — professional, engaging, every factual claim cites a Fact_ID"),
  visual: VisualSpec,
  activity: z.string().nullable().describe("High-engagement learner activity (simulation, branching, recall). Null if this scene is passive."),
  branching: z.string().nullable().describe("Strategic decision point with logical consequences. Null if scene is linear."),
  speakerNotes: z.string().nullable().describe("Production and pedagogical notes for the ID / presenter"),
  citations: z.array(z.string()).describe("Fact_IDs from the ledger used in this scene, e.g. ['Fact_ID: 1', 'Fact_ID: 3']"),
  dataDeficits: z.array(z.string()).describe("Topics that need more source material. Use when the fact ledger is sparse."),
  // Populated by the route after inserting a visual_generations DB record. Never set by the AI.
  visualId: z.string().optional(),
});

export const NodeScript = z.object({
  nodeTitle: z.string().describe("Full descriptive title of this learning node"),
  pedagogicalMode: z.string().describe("Instructional mode from the blueprint, e.g. Direct Instruction, Problem-Based Learning"),
  cognitiveVerb: z.string().describe("Primary Bloom's taxonomy verb for this node, e.g. apply, analyze, evaluate"),
  scaffolding: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe("LOW = remember/understand; MEDIUM = apply/analyze; HIGH = evaluate/create"),
  scenes: z.array(Scene).min(1).describe("Ordered sequence of instructional scenes. Aim for 3–6 per node."),
});

export const AuditResult = z.object({
  groundingScore: z.number().int().min(0).max(10).describe("0–10. 10 = every claim anchored to fact ledger or valid [DATA_DEFICIT] marker"),
  cognitiveLoad: z.number().int().min(0).max(10).describe("0–10. Lower is more digestible for the learner"),
  hallucinated: z.boolean().describe("True if any narration contains a factual claim not present in the ledger and not marked as a data deficit"),
  critique: z.string().describe("Bulleted list of unsupported claims, or SKELETON_VERIFIED if the content is a clean structural skeleton"),
});

export const FactItem = z.object({
  id: z.number().int().describe("Sequential Fact_ID"),
  fact: z.string().describe("The extracted atomic fact, metric, definition, or procedural step"),
});

export const FactLedger = z.object({
  isEmpty: z.boolean().describe("True when the source chunks contain no relevant facts for this node"),
  facts: z.array(FactItem).describe("All extracted facts. Empty array when isEmpty is true."),
});

// TypeScript types inferred from schemas
export type VisualSpecType = z.infer<typeof VisualSpec>;
export type SceneType = z.infer<typeof Scene>;
export type NodeScriptType = z.infer<typeof NodeScript>;
export type AuditResultType = z.infer<typeof AuditResult>;
export type FactLedgerType = z.infer<typeof FactLedger>;

// Result type returned by InstructionalArchitectService.draftNodeScript()
export interface DraftResult {
  nodeScript: NodeScriptType;
  citations: string[];
  groundingScore: number;
  cognitiveLoadScore: number;
  hallucinationFlag: boolean;
  semanticDelta?: string;
  groundingTypes: string[];
}
