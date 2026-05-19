import { describe, it, expect } from 'vitest';
import { buildULS } from './builder';
import type { DraftResult } from '@/types/architect';

const MOCK_BLUEPRINT_JSON = {
  target_audience: {
    demographics: { roles: ['Software Engineer', 'Developer'] },
  },
  content_outline: {
    modules: [
      { id: 'NODE_01', title: 'Intro', delivery_method: 'video' },
      { id: 'NODE_02', title: 'Advanced', delivery_method: 'scorm' },
    ],
  },
};

const MOCK_SCENE = {
  id: 'scene-01',
  title: 'Scene 1',
  narration: 'Welcome.',
  visual: {
    artDirection: 'Wide corporate shot. Clean and professional.',
    generationPrompt: 'Photorealistic wide shot of modern office.',
  },
  activity: null,
  branching: null,
  speakerNotes: null,
  citations: ['Fact_ID: 1'],
  dataDeficits: [],
};

const MOCK_DRAFT: DraftResult = {
  nodeScript: {
    nodeTitle: 'Introduction',
    pedagogicalMode: 'Direct Instruction',
    cognitiveVerb: 'explain',
    scaffolding: 'LOW',
    scenes: [MOCK_SCENE],
  },
  citations: ['SOP_doc.pdf'],
  groundingScore: 8,
  cognitiveLoadScore: 5,
  hallucinationFlag: false,
  semanticDelta: undefined,
  groundingTypes: ['pdf'],
};

const MODULES = [
  { id: 'NODE_01', title: 'Intro', pedagogicalMode: 'Direct Instruction', scaffolding: 'LOW' as const },
  { id: 'NODE_02', title: 'Advanced', pedagogicalMode: 'Application', scaffolding: 'HIGH' as const },
];

describe('buildULS', () => {
  it('returns a valid ULSSchema-conformant object', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT },
    });
    expect(uls.uls_version).toBe('1.0-GLA');
    expect(uls.pedagogical_model).toBe('Merrill_First_Principles');
    expect(uls.architecture_nodes).toHaveLength(2);
  });

  it('resolves Merrill mode from pedagogicalMode', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT },
    });
    expect(uls.architecture_nodes[0].mode).toBe('DEMONSTRATION');
    expect(uls.architecture_nodes[1].mode).toBe('APPLICATION');
  });

  it('marks undrafted nodes as synthetic_required', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT },
    });
    expect(uls.architecture_nodes[0].synthetic_required).toBe(false);
    expect(uls.architecture_nodes[1].synthetic_required).toBe(true);
  });

  it('computes nodes_completed correctly', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT },
    });
    expect(uls.meta.nodes_completed).toBe(1);
    expect(uls.meta.total_nodes).toBe(2);
  });

  it('sets strategy_alignment HIGH when groundingScore is ≥7', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT }, // groundingScore: 8
    });
    expect(uls.meta.strategy_alignment).toBe('HIGH');
  });

  it('sets reading_level to Technical_Professional for engineering roles', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: {},
    });
    expect(uls.guardrails.reading_level).toBe('Technical_Professional');
  });

  it('passes CLG when all drafted scores are below 8.5', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: MOCK_DRAFT }, // cognitiveLoadScore: 5
    });
    expect(uls.guardrails.clg_passed).toBe(true);
  });

  it('fails CLG when a drafted score exceeds 8.5', () => {
    const highClgDraft: DraftResult = { ...MOCK_DRAFT, cognitiveLoadScore: 9 };
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: { 0: highClgDraft },
    });
    expect(uls.guardrails.clg_passed).toBe(false);
    expect(uls.guardrails.max_cognitive_load).toBe(9);
  });

  it('handles an empty scriptOutputs gracefully', () => {
    const uls = buildULS({
      blueprintId: 'bp-001',
      blueprintJson: MOCK_BLUEPRINT_JSON,
      modules: MODULES,
      scriptOutputs: {},
    });
    expect(uls.meta.nodes_completed).toBe(0);
    expect(uls.guardrails.clg_passed).toBe(true);
    expect(uls.architecture_nodes.every((n) => n.synthetic_required)).toBe(true);
  });
});
