import { z } from 'zod';

const InstructionalScript = z.object({
  visual_treatment: z.string(),
  narration: z.string(),
  on_screen_text: z.string(),
});

export const ArchitectureNode = z.object({
  node_id: z.string(),
  title: z.string(),
  mode: z.enum(['TASK_CENTERED', 'ACTIVATION', 'DEMONSTRATION', 'APPLICATION', 'INTEGRATION']),
  cognitive_verb: z.string(),
  scaffolding: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  cognitive_load: z.number().min(0).max(10),
  grounding_score: z.number().min(0).max(10),
  hallucination_flag: z.boolean(),
  instructional_script: InstructionalScript,
  asset_grounding: z.array(z.string()),
  synthetic_required: z
    .boolean()
    .describe('True when the node has no grounded source assets — Nova must generate synthetic content'),
});

export const ULSMeta = z.object({
  polaris_id: z.string(),
  strategy_alignment: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  generated_at: z.string().datetime(),
  total_nodes: z.number().int().min(0),
  nodes_completed: z.number().int().min(0),
});

export const ULSGuardrails = z.object({
  max_cognitive_load: z.number(),
  reading_level: z.string(),
  clg_threshold: z.number().default(8.5),
  clg_passed: z.boolean(),
});

export const ULSSchema = z.object({
  uls_version: z.literal('1.0-GLA'),
  meta: ULSMeta,
  pedagogical_model: z.literal('Merrill_First_Principles'),
  architecture_nodes: z.array(ArchitectureNode),
  guardrails: ULSGuardrails,
});

export type ULSType = z.infer<typeof ULSSchema>;
export type ArchitectureNodeType = z.infer<typeof ArchitectureNode>;
export type ULSGuardrailsType = z.infer<typeof ULSGuardrails>;
