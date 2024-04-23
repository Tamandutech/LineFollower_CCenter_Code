import { withTimeout } from 'src/lib/promises';
import { beforeEach, afterEach, it, expect, describe, vi } from 'vitest';

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should resolve if the promise resolves within the specified time', async () => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve('resolved'), 100)
    );
    const resultPromise = withTimeout(promise, 200);
    vi.advanceTimersByTime(100);
    const result = await resultPromise;
    expect(result).toBe('resolved');
  });

  it('should reject with the specified reason if the promise does not resolve within the specified time', async () => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve('resolved'), 200)
    );
    const resultPromise = withTimeout(promise, 100, 'timeout');
    vi.advanceTimersByTime(200);
    await expect(resultPromise).rejects.toBe('timeout');
  });

  it('should reject with undefined if the promise does not resolve within the specified time and no reason is specified', async () => {
    const promise = new Promise((resolve) =>
      setTimeout(() => resolve('resolved'), 200)
    );
    const resultPromise = withTimeout(promise, 100);
    vi.advanceTimersByTime(200);
    await expect(resultPromise).rejects.toBeUndefined();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
