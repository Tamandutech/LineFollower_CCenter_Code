import { type Ref, ref } from 'vue';

export type UseLoadingReturn<This, Args extends unknown[], Return> = readonly [
  (this: This, ...args: Args) => Promise<Return>,
  Ref<boolean>,
];

/**
 * Retorna uma referência para o estado de execução de uma função.
 *
 * @param {Function} routine Função para notificar o estado de execução
 * @returns {UseLoadingReturn} Função cuja execução pode ser notificada e referência para o estado de execução
 */
export const useLoading = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
): UseLoadingReturn<This, Args, Return> => {
  /**
   * Estado de execução da função
   */
  const loading = ref<boolean>(false);

  /**
   * Função cuja execução pode ser notificada
   */
  async function notifiedRoutine(this: This, ...args: Args): Promise<Return> {
    loading.value = true;
    try {
      const result = await routine.call(this, ...args);
      if (result instanceof Error) {
        throw result;
      }
      return result;
    } finally {
      loading.value = false;
    }
  }

  return [notifiedRoutine, loading] as const;
};
