import { describe, it, expect } from 'vitest';
import { assessCLG, CLG_THRESHOLD } from './cognitiveLoad';

describe('assessCLG', () => {
  it('returns a passing report when all scores are below threshold', () => {
    const report = assessCLG([
      { nodeId: 'NODE_01', score: 5 },
      { nodeId: 'NODE_02', score: 7 },
    ]);
    expect(report.passes).toBe(true);
    expect(report.violated).toHaveLength(0);
    expect(report.max).toBe(7);
    expect(report.mean).toBe(6);
  });

  it('flags a node that exceeds the threshold', () => {
    const report = assessCLG([
      { nodeId: 'NODE_01', score: 5 },
      { nodeId: 'NODE_02', score: 9 },
    ]);
    expect(report.passes).toBe(false);
    expect(report.violated).toHaveLength(1);
    expect(report.violated[0].nodeId).toBe('NODE_02');
  });

  it('treats exactly threshold as passing (threshold is exclusive)', () => {
    const report = assessCLG([{ nodeId: 'NODE_01', score: CLG_THRESHOLD }]);
    expect(report.passes).toBe(true);
  });

  it('flags a score of threshold + 0.1 as violation', () => {
    const report = assessCLG([{ nodeId: 'NODE_01', score: CLG_THRESHOLD + 0.1 }]);
    expect(report.passes).toBe(false);
    expect(report.violated).toHaveLength(1);
  });

  it('returns safe defaults for an empty input', () => {
    const report = assessCLG([]);
    expect(report.passes).toBe(true);
    expect(report.max).toBe(0);
    expect(report.mean).toBe(0);
    expect(report.violated).toHaveLength(0);
  });

  it('computes correct mean across multiple nodes', () => {
    const report = assessCLG([
      { nodeId: 'N1', score: 3 },
      { nodeId: 'N2', score: 5 },
      { nodeId: 'N3', score: 7 },
    ]);
    expect(report.mean).toBe(5);
    expect(report.max).toBe(7);
  });
});
