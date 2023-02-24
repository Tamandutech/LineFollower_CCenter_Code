import { ref } from 'vue';
import type { Ref } from 'vue';

export const useErrorCapturing = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  errorsToCatch: Function[],
  errorRef?: Ref<unknown>,
  reThrow = false
): {
  routineWithErrorCapturing: (this: This, ...args: Args) => Promise<Return>;
  error: Ref<unknown>;
} => {
  const error = errorRef || ref(null);

  async function routineWithErrorCapturing(
    this: This,
    ...args: Args
  ): Promise<Return> {
    try {
      const result = await routine.call(this, ...args);
      error.value = null;
      return Promise.resolve(result);
    } catch (e) {
      if (!errorsToCatch.some((errorType) => e instanceof errorType)) {
        throw e;
      }

      error.value = e;
      if (reThrow) throw e;
    }
  }

  return { routineWithErrorCapturing, error };
};
