import { describe, it, expect } from 'vitest';
import { NodeScript, Scene } from '@/types/architect';

describe('NodeScript schema', () => {
  const validScene = {
    id: 'scene-01',
    title: 'Scene 1: Introduction',
    narration: 'Welcome to the module. [Fact_ID: 1]',
    visual: {
      artDirection: 'Wide establishing shot of a modern training facility.',
      generationPrompt: 'Photorealistic wide shot of a modern corporate training room, natural lighting, 8k.',
    },
    activity: null,
    branching: null,
    speakerNotes: 'Presenter should pause after this scene.',
    citations: ['Fact_ID: 1'],
    dataDeficits: [],
  };

  it('validates a well-formed NodeScript', () => {
    const result = NodeScript.safeParse({
      nodeTitle: 'Safety Induction Module',
      pedagogicalMode: 'Direct Instruction',
      cognitiveVerb: 'apply',
      scaffolding: 'MEDIUM',
      scenes: [validScene],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid scaffolding value', () => {
    const result = NodeScript.safeParse({
      nodeTitle: 'Test',
      pedagogicalMode: 'Direct Instruction',
      cognitiveVerb: 'apply',
      scaffolding: 'EXTREME',
      scenes: [validScene],
    });
    expect(result.success).toBe(false);
  });

  it('requires at least one scene', () => {
    const result = NodeScript.safeParse({
      nodeTitle: 'Test',
      pedagogicalMode: 'Direct Instruction',
      cognitiveVerb: 'apply',
      scaffolding: 'LOW',
      scenes: [],
    });
    expect(result.success).toBe(false);
  });

  it('allows optional visualId to be absent or a string', () => {
    const withId = Scene.safeParse({ ...validScene, visualId: 'abc-123' });
    const withoutId = Scene.safeParse(validScene);
    expect(withId.success).toBe(true);
    expect(withoutId.success).toBe(true);
  });
});
