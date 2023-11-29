import { ref } from 'vue';
import type { Ref } from 'vue';

/**
 *
 * @param routine Função de entrada
 * @param errorsToCatch Erros a serem capturados
 * @param errorRef variável de estado para se armazenar os erros ocorridos
 * @param mustReThrow Relançar os erros capturados (`false` por padrão)
 * @returns Objeto com a função modificada na propriedade com o nome da função de entrada caso ela possua um nome, ou na propriedade `routineWithErrorCapturing` caso contrário, e a variável de estado onde será armazenado o erro (será utilizado o parâmetro caso ele seja fornecido).
 */
export const useErrorCapturing = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  errorsToCatch: Function[],
  errorRef?: Ref<unknown>,
  mustReThrow = false
): {
  [key: string]: (this: This, ...args: Args) => Promise<Return>;
} & {
  error: Ref<unknown>;
} => {
  const error = errorRef || ref(null);

  return {
    [routine.name || 'routineWithErrorCapturing']: async function (
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
        if (mustReThrow) throw e;
      }
    },
    error,
  };
};
