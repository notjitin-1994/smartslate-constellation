import { describe, it, expect } from 'vitest';
import { ULSSchema } from './schema';

const VALID_ULS = {
  uls_version: '1.0-GLA' as const,
  meta: {
    polaris_id: 'bp-001',
    strategy_alignment: 'HIGH' as const,
    generated_at: new Date().toISOString(),
    total_nodes: 2,
    nodes_completed: 1,
  },
  pedagogical_model: 'Merrill_First_Principles' as const,
  architecture_nodes: [
    {
      node_id: 'NODE_01',
      title: 'Introduction',
      mode: 'ACTIVATION' as const,
      cognitive_verb: 'recall',
      scaffolding: 'LOW' as const,
      cognitive_load: 4,
      grounding_score: 8,
      hallucination_flag: false,
      instructional_script: {
        visual_treatment: 'Wide shot of training facility',
        narration: 'Welcome to the module.',
        on_screen_text: 'Introduction',
      },
      asset_grounding: ['SOP_01'],
      synthetic_required: false,
    },
  ],
  guardrails: {
    max_cognitive_load: 4,
    reading_level: 'Technical_Professional',
    clg_threshold: 8.5,
    clg_passed: true,
  },
};

describe('ULSSchema', () => {
  it('accepts a valid ULS payload', () => {
    const result = ULSSchema.safeParse(VALID_ULS);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid uls_version', () => {
    const result = ULSSchema.safeParse({ ...VALID_ULS, uls_version: '2.0' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid pedagogical_model', () => {
    const result = ULSSchema.safeParse({ ...VALID_ULS, pedagogical_model: 'Gagne' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid Merrill mode on an architecture node', () => {
    const badNode = { ...VALID_ULS.architecture_nodes[0], mode: 'INVALID_MODE' };
    const result = ULSSchema.safeParse({
      ...VALID_ULS,
      architecture_nodes: [badNode],
    });
    expect(result.success).toBe(false);
  });

  it('rejects cognitive_load above 10', () => {
    const badNode = { ...VALID_ULS.architecture_nodes[0], cognitive_load: 11 };
    const result = ULSSchema.safeParse({
      ...VALID_ULS,
      architecture_nodes: [badNode],
    });
    expect(result.success).toBe(false);
  });

  it('accepts an empty architecture_nodes array', () => {
    const result = ULSSchema.safeParse({ ...VALID_ULS, architecture_nodes: [] });
    expect(result.success).toBe(true);
  });

  it('round-trips: parse then stringify then parse gives the same data', () => {
    const first = ULSSchema.parse(VALID_ULS);
    const second = ULSSchema.parse(JSON.parse(JSON.stringify(first)));
    expect(second.meta.polaris_id).toBe(first.meta.polaris_id);
    expect(second.architecture_nodes[0].mode).toBe(first.architecture_nodes[0].mode);
  });
});
