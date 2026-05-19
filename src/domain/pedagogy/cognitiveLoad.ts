export const CLG_THRESHOLD = 8.5;

export interface CLGReport {
  max: number;
  mean: number;
  violated: Array<{ nodeId: string; score: number }>;
  passes: boolean;
}

export function assessCLG(
  scores: Array<{ nodeId: string; score: number }>
): CLGReport {
  if (scores.length === 0) {
    return { max: 0, mean: 0, violated: [], passes: true };
  }
  const values = scores.map((s) => s.score);
  const max = Math.max(...values);
  const mean = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const violated = scores.filter((s) => s.score > CLG_THRESHOLD);
  return { max, mean, violated, passes: violated.length === 0 };
}
