interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULTS: RetryOptions = { maxAttempts: 3, baseDelayMs: 1000, maxDelayMs: 10_000 };

function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('rate limit') ||
    msg.includes('overloaded') ||
    msg.includes('quota') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs } = { ...DEFAULTS, ...opts };
  let lastErr: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === maxAttempts) throw err;
      // Exponential backoff with ±25% jitter
      const base = baseDelayMs * 2 ** (attempt - 1);
      const jitter = base * 0.25 * (Math.random() * 2 - 1);
      const delay = Math.min(base + jitter, maxDelayMs);
      await sleep(delay);
    }
  }

  throw lastErr;
}
