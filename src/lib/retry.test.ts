import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry } from './retry';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('withRetry', () => {
  it('resolves immediately when the function succeeds on the first attempt', async () => {
    const fn = vi.fn(async () => 'success');
    const result = await withRetry(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on a 429 error and eventually succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('429 Rate limit exceeded'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 100 });
    // Advance timers to skip the backoff delay
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on a 503 error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('503 Service Unavailable'))
      .mockResolvedValueOnce('ok');

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retries on rate limit message', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('rate limit reached for model'))
      .mockResolvedValueOnce('done');

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 50 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('done');
  });

  it('throws immediately on a non-retryable error (not a transient error)', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Invalid API key');
    });
    await expect(withRetry(fn, { maxAttempts: 3, baseDelayMs: 50 })).rejects.toThrow(
      'Invalid API key'
    );
    // Should not retry non-retryable errors
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting all attempts', async () => {
    const fn = vi.fn(async () => {
      throw new Error('503 persistent outage');
    });
    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 50, maxDelayMs: 200 });
    // Attach rejection handler before running timers to avoid unhandled-rejection warning
    const assertion = expect(promise).rejects.toThrow('503 persistent outage');
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects maxAttempts: 1 — no retries', async () => {
    const fn = vi.fn(async () => {
      throw new Error('429 rate limit');
    });
    await expect(withRetry(fn, { maxAttempts: 1 })).rejects.toThrow('429 rate limit');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('returns the value type correctly through the generic', async () => {
    const fn = vi.fn(async (): Promise<number> => 42);
    const result = await withRetry(fn);
    expect(result).toBe(42);
  });

  it('retries on overloaded message', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('model overloaded, try again'))
      .mockResolvedValueOnce('result');

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 50 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('result');
  });

  it('retries on quota message', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('quota exceeded for this project'))
      .mockResolvedValueOnce('quota-ok');

    const promise = withRetry(fn, { maxAttempts: 2, baseDelayMs: 50 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('quota-ok');
  });
});
