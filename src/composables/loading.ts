import { ref } from 'vue';

// TODO: Implementar timeout (lançar erro quando estourar)
export const useLoading = () => {
  const loading = ref<string | null>();

  /**
   * Retorna uma função, com o nome fornecido, para que a variável de estado
   * `loading` possa ser utilizada em templates comparando-se o seu valor atual com
   * o nome de um procedimento em execução
   * @example :loading="loading.value === listParameters.name"
   * @param routine Função para notificar a execução
   * @param routineName Nome da função. Por padrão se utiliza a propriedade (`.name`)
   * @returns Função cuja execução pode ser notificada através da ref `loading`
   */
  function notifyLoading<This, Args extends unknown[], Return>(
    routine: (this: This, ...args: Args) => Promise<Return>,
    routineName?: string
  ) {
    routineName = routineName || routine.name;

    return {
      [routineName]: async function (
        this: This,
        ...args: Args
      ): Promise<Return> {
        loading.value = routineName || routine.name;

        try {
          const result = await routine.call(this, ...args);
          return Promise.resolve(result);
        } finally {
          loading.value = null;
        }
      },
    }[routineName];
  }

  return { loading, notifyLoading };
};
