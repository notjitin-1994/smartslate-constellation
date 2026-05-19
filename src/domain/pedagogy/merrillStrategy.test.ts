import { describe, it, expect } from 'vitest';
import { resolveInstructionalStrategy, resolveMode } from './merrillStrategy';

describe('resolveInstructionalStrategy', () => {
  it('maps direct instruction to DEMONSTRATION', () => {
    const s = resolveInstructionalStrategy('Direct Instruction');
    expect(s.merrillMode).toBe('DEMONSTRATION');
    expect(s.bloomLevel).toBe('understand');
  });

  it('maps problem-based learning to APPLICATION', () => {
    const s = resolveInstructionalStrategy('Problem-Based Learning');
    expect(s.merrillMode).toBe('APPLICATION');
    expect(s.cognitiveVerb).toBe('demonstrate');
  });

  it('maps activation to ACTIVATION', () => {
    const s = resolveInstructionalStrategy('activation');
    expect(s.merrillMode).toBe('ACTIVATION');
    expect(s.cognitiveVerb).toBe('recall');
  });

  it('maps scenario-based to APPLICATION', () => {
    const s = resolveInstructionalStrategy('Scenario-Based');
    expect(s.merrillMode).toBe('APPLICATION');
  });

  it('maps task-centered (with dash) to TASK_CENTERED', () => {
    const s = resolveInstructionalStrategy('task-centered');
    expect(s.merrillMode).toBe('TASK_CENTERED');
    expect(s.bloomLevel).toBe('analyze');
  });

  it('maps integration to INTEGRATION', () => {
    const s = resolveInstructionalStrategy('integration');
    expect(s.merrillMode).toBe('INTEGRATION');
    expect(s.cognitiveVerb).toBe('design');
  });

  it('defaults to DEMONSTRATION for unknown modes', () => {
    const s = resolveInstructionalStrategy('Something Entirely Unknown');
    expect(s.merrillMode).toBe('DEMONSTRATION');
  });

  it('returns a non-empty promptGuidance for every mode', () => {
    const modes = ['activation', 'direct instruction', 'scenario-based', 'integration', 'task-centered'];
    for (const mode of modes) {
      const s = resolveInstructionalStrategy(mode);
      expect(s.promptGuidance.length).toBeGreaterThan(10);
    }
  });
});

describe('resolveMode', () => {
  it('returns a valid MerrillMode string', () => {
    const valid = ['TASK_CENTERED', 'ACTIVATION', 'DEMONSTRATION', 'APPLICATION', 'INTEGRATION'];
    expect(valid).toContain(resolveMode('Direct Instruction'));
    expect(valid).toContain(resolveMode('Problem Based'));
    expect(valid).toContain(resolveMode('task centered'));
  });
});
