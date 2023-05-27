import { TimeoutError } from './errors';

export function getTimer(seconds: number): () => Promise<TimeoutError> {
  return async () =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), seconds * 1000)
    );
}
