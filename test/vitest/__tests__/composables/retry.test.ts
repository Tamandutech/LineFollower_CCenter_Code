import { it, expect, describe, vi } from 'vitest';
import { useRetry } from 'src/composables/retry';

describe('useRetry', () => {
  describe('retry', () => {
    it('should retry a function until it succeeds', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error())
        .mockRejectedValueOnce(new Error())
        .mockResolvedValueOnce('OK');
      const [fnWithRetry] = useRetry(fn, [Error], {
        maxRetries: 3,
        delay: 0,
      });
      expect(fnWithRetry()).resolves.toBe('OK');
    });

    it('should throw an error if the function fails too many times', async () => {
      const fn = vi.fn().mockRejectedValue(new Error());
      const [fnWithRetry] = useRetry(fn, [Error], {
        maxRetries: 3,
        delay: 0,
      });
      expect(fnWithRetry()).rejects.toThrowError();
    });
  });
});
