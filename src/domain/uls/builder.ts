/* eslint-disable @typescript-eslint/no-explicit-any */
import { ULSSchema, type ULSType } from './schema';
import { resolveInstructionalStrategy, resolveMode } from '@/domain/pedagogy/merrillStrategy';
import { assessCLG, CLG_THRESHOLD } from '@/domain/pedagogy/cognitiveLoad';
import type { DraftResult } from '@/types/architect';

export interface BuildInput {
  blueprintId: string;
  blueprintJson: any;
  modules: Array<{
    id: string;
    title: string;
    pedagogicalMode?: string;
    scaffolding?: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  scriptOutputs: Record<number, DraftResult>;
}

function deriveReadingLevel(blueprintJson: any): string {
  const roles: string[] = blueprintJson?.target_audience?.demographics?.roles || [];
  const hasTechnical = roles.some((r: string) =>
    /engineer|developer|technical|analyst|architect|scientist|programmer/i.test(r)
  );
  return hasTechnical ? 'Technical_Professional' : 'General_Professional';
}

function deriveStrategyAlignment(
  scriptOutputs: Record<number, DraftResult>
): 'HIGH' | 'MEDIUM' | 'LOW' {
  const outputs = Object.values(scriptOutputs);
  if (outputs.length === 0) return 'LOW';
  const avg = outputs.reduce((sum, o) => sum + o.groundingScore, 0) / outputs.length;
  if (avg >= 7) return 'HIGH';
  if (avg >= 4) return 'MEDIUM';
  return 'LOW';
}

export function buildULS(input: BuildInput): ULSType {
  const { blueprintId, blueprintJson, modules, scriptOutputs } = input;

  const clgScores = modules
    .map((m, i) => ({
      nodeId: m.id,
      score: scriptOutputs[i]?.cognitiveLoadScore ?? 0,
    }))
    .filter((_, i) => scriptOutputs[i] !== undefined);

  const clgReport = assessCLG(clgScores);

  const architectureNodes = modules.map((mod, i) => {
    const output = scriptOutputs[i];
    const strategy = resolveInstructionalStrategy(mod.pedagogicalMode || 'Direct Instruction');
    const firstScene = output?.nodeScript?.scenes?.[0];

    return {
      node_id: mod.id,
      title: mod.title,
      mode: resolveMode(mod.pedagogicalMode || 'Direct Instruction'),
      cognitive_verb: output?.nodeScript?.cognitiveVerb ?? strategy.cognitiveVerb,
      scaffolding: (output?.nodeScript?.scaffolding ?? mod.scaffolding ?? 'MEDIUM') as
        | 'LOW'
        | 'MEDIUM'
        | 'HIGH',
      cognitive_load: output?.cognitiveLoadScore ?? 0,
      grounding_score: output?.groundingScore ?? 0,
      hallucination_flag: output?.hallucinationFlag ?? false,
      instructional_script: {
        visual_treatment: firstScene?.visual?.artDirection?.split('.')[0] ?? 'Pending',
        narration: firstScene?.narration ?? 'Content generation required.',
        on_screen_text: firstScene?.title ?? mod.title,
      },
      asset_grounding: output?.citations ?? [],
      synthetic_required: !output || (output.citations?.length ?? 0) === 0,
    };
  });

  const nodesCompleted = modules.filter((_, i) => scriptOutputs[i] !== undefined).length;

  const raw = {
    uls_version: '1.0-GLA' as const,
    meta: {
      polaris_id: blueprintId,
      strategy_alignment: deriveStrategyAlignment(scriptOutputs),
      generated_at: new Date().toISOString(),
      total_nodes: modules.length,
      nodes_completed: nodesCompleted,
    },
    pedagogical_model: 'Merrill_First_Principles' as const,
    architecture_nodes: architectureNodes,
    guardrails: {
      max_cognitive_load: clgReport.max,
      reading_level: deriveReadingLevel(blueprintJson),
      clg_threshold: CLG_THRESHOLD,
      clg_passed: clgReport.passes,
    },
  };

  return ULSSchema.parse(raw);
}
