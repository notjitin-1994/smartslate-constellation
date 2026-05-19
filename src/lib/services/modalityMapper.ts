// Promoted from modalityMapper.test.ts where it lived as inline-only logic.
// Wired into constellation/page.tsx for the Intelligent Modality Matcher.

interface BlueprintModality {
  type: string;
  rationale: string;
}

export interface EnrichedModule {
  title: string;
  targetModality: string;
  scaffolding: 'LOW' | 'MEDIUM' | 'HIGH';
}

const BLOOM_SCAFFOLDING: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
  remember: 'LOW',
  understand: 'LOW',
  apply: 'MEDIUM',
  analyze: 'MEDIUM',
  evaluate: 'HIGH',
  create: 'HIGH',
};

export function mapScaffolding(bloomLevel: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  return BLOOM_SCAFFOLDING[bloomLevel?.toLowerCase()] ?? 'MEDIUM';
}

export function extractEnrichedModules(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blueprint: { blueprint_json: any }
): EnrichedModule[] {
  const bj = blueprint.blueprint_json;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const modules: any[] = bj.content_outline?.modules || [];
  const globalModalities: BlueprintModality[] = bj.instructional_strategy?.modalities || [];
  const defaultModality: BlueprintModality =
    globalModalities[0] || { type: 'Standard eLearning', rationale: 'Default delivery method.' };
  const primaryBloom: string =
    bj.learning_objectives?.objectives?.[0]?.title || 'apply';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return modules.map((mod: any) => {
    const deliveryMethod = String(mod.delivery_method || '').toLowerCase();

    const matchedModality =
      globalModalities.find((m) => {
        const typeWords = m.type.toLowerCase().split(/[\s()/-]+/);
        const deliveryWords = deliveryMethod.split(/[\s()/-]+/);
        return (
          deliveryWords.some((dw) => dw.length > 2 && typeWords.includes(dw)) ||
          typeWords.some((tw) => tw.length > 2 && deliveryWords.includes(tw))
        );
      }) ?? defaultModality;

    return {
      title: mod.title,
      targetModality: matchedModality.type,
      scaffolding: mapScaffolding(primaryBloom),
    };
  });
}
