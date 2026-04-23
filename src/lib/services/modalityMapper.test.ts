/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';

// Simulating the extraction logic for testing
const mapScaffolding = (bloomLevel: string) => {
  const map: Record<string, string> = {
    'remember': 'LOW',
    'understand': 'LOW',
    'apply': 'MEDIUM',
    'analyze': 'MEDIUM',
    'evaluate': 'HIGH',
    'create': 'HIGH'
  };
  return map[bloomLevel?.toLowerCase()] || 'MEDIUM';
};

const extractEnrichedModules = (blueprint: any) => {
  const bj = blueprint.blueprint_json;
  const modules = bj.content_outline?.modules || [];
  const globalModalities = bj.instructional_strategy?.modalities || [];

  return modules.map((mod: any) => {
    const deliveryMethod = String(mod.delivery_method || '').toLowerCase();
    const matchedModality = globalModalities.find((m: any) => {
      const typeWords = m.type.toLowerCase().split(/[\s()/-]+/);
      const deliveryWords = deliveryMethod.split(/[\s()/-]+/);
      return deliveryWords.some((dw: string) => dw.length > 2 && typeWords.includes(dw)) ||
             typeWords.some((tw: string) => tw.length > 2 && deliveryWords.includes(tw));
    }) || globalModalities[0] || { type: 'Standard eLearning', rationale: 'Default delivery method.' };

    return {
      title: mod.title,
      targetModality: matchedModality.type,
      scaffolding: mapScaffolding(bj.learning_objectives?.objectives?.[0]?.title || 'apply')
    };
  });
};

describe('Modality Mapper Logic', () => {
  const mockBlueprint = {
    blueprint_json: {
      learning_objectives: { objectives: [{ title: 'apply' }] },
      content_outline: {
        modules: [
          { title: 'Intro', delivery_method: 'Video Lectures' },
          { title: 'Practice', delivery_method: 'Interactive SCORM' }
        ]
      },
      instructional_strategy: {
        modalities: [
          { type: 'Studio Video Lectures', rationale: 'Engage.' },
          { type: 'Interactive eLearning (SCORM)', rationale: 'Mastery.' }
        ]
      }
    }
  };

  it('should correctly map Video Lectures to Studio Video modality', () => {
    const enriched = extractEnrichedModules(mockBlueprint);
    expect(enriched[0].targetModality).toBe('Studio Video Lectures');
  });

  it('should correctly map SCORM string to Interactive modality', () => {
    const enriched = extractEnrichedModules(mockBlueprint);
    expect(enriched[1].targetModality).toBe('Interactive eLearning (SCORM)');
  });
});
