import { ref, watchEffect } from 'vue';
import type { Ref } from 'vue';

/**
 * Retorna um valor booleano que indica se a referência fornecida é verdadeira.
 *
 * @param {Ref<unknown>} reference Referência a ser verificada
 * @returns {Ref<boolean>} Estado `true` se a referência for verdadeira, `false` caso contrário
 */
export const useIsTruthy = (reference: Ref<unknown>): Ref<boolean> => {
  const isTruthy = ref(false);
  watchEffect(() => {
    if (reference.value) isTruthy.value = true;
  });

  return isTruthy;
};
