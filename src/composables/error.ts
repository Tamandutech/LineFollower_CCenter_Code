import { ref } from 'vue';
import type { Ref } from 'vue';

export const useErrorCapturing = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  errorsToCatch: Function[],
  errorRef?: Ref<unknown>,
  errorCapturedRef?: Ref<boolean>,
  reThrow = false
): {
  routineWithErrorCapturing: (this: This, ...args: Args) => Promise<Return>;
  error: Ref<unknown>;
  errorCaptured: Ref<boolean>;
} => {
  const error = errorRef || ref(null);
  const errorCaptured = errorCapturedRef || ref(false);

  async function routineWithErrorCapturing(
    this: This,
    ...args: Args
  ): Promise<Return> {
    try {
      const result = await routine.call(this, ...args);
      error.value = null;
      errorCaptured.value = false;
      return Promise.resolve(result);
    } catch (e) {
      if (!errorsToCatch.some((errorType) => e instanceof errorType)) {
        throw e;
      }

      error.value = e;
      errorCaptured.value = true;

      if (reThrow) throw e;
    }
  }

  return { routineWithErrorCapturing, error, errorCaptured };
};
