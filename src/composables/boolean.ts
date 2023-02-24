import { ref, watchEffect } from 'vue';
import type { Ref } from 'vue';

export const useIsTruthy = (reference: Ref<unknown>) => {
  const isTruthy = ref(false);
  watchEffect(() => {
    if (reference.value) isTruthy.value = true;
  });

  return isTruthy;
};
