import { describe, it, expect } from 'vitest';
import { extractEnrichedModules, mapScaffolding } from './modalityMapper';

describe('mapScaffolding', () => {
  it('maps lower Bloom levels to LOW scaffolding', () => {
    expect(mapScaffolding('remember')).toBe('LOW');
    expect(mapScaffolding('understand')).toBe('LOW');
  });

  it('maps mid Bloom levels to MEDIUM scaffolding', () => {
    expect(mapScaffolding('apply')).toBe('MEDIUM');
    expect(mapScaffolding('analyze')).toBe('MEDIUM');
  });

  it('maps upper Bloom levels to HIGH scaffolding', () => {
    expect(mapScaffolding('evaluate')).toBe('HIGH');
    expect(mapScaffolding('create')).toBe('HIGH');
  });

  it('defaults to MEDIUM for unknown values', () => {
    expect(mapScaffolding('unknown')).toBe('MEDIUM');
    expect(mapScaffolding('')).toBe('MEDIUM');
  });
});

describe('extractEnrichedModules', () => {
  const mockBlueprint = {
    blueprint_json: {
      learning_objectives: { objectives: [{ title: 'apply' }] },
      content_outline: {
        modules: [
          { title: 'Intro', delivery_method: 'Video Lectures' },
          { title: 'Practice', delivery_method: 'Interactive SCORM' },
        ],
      },
      instructional_strategy: {
        modalities: [
          { type: 'Studio Video Lectures', rationale: 'Engage.' },
          { type: 'Interactive eLearning (SCORM)', rationale: 'Mastery.' },
        ],
      },
    },
  };

  it('maps Video Lectures delivery to Studio Video Lectures modality', () => {
    const enriched = extractEnrichedModules(mockBlueprint);
    expect(enriched[0].targetModality).toBe('Studio Video Lectures');
  });

  it('maps SCORM delivery to Interactive eLearning modality', () => {
    const enriched = extractEnrichedModules(mockBlueprint);
    expect(enriched[1].targetModality).toBe('Interactive eLearning (SCORM)');
  });

  it('derives scaffolding from the blueprint Bloom level', () => {
    const enriched = extractEnrichedModules(mockBlueprint);
    expect(enriched[0].scaffolding).toBe('MEDIUM'); // 'apply' → MEDIUM
  });
});
