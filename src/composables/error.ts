import { ref } from 'vue';
import type { Ref } from 'vue';

export type UseErrorCapturingReturn<
  This,
  Args extends unknown[],
  Return,
> = readonly [(this: This, ...args: Args) => Promise<Return>, Ref<unknown>];

/**
 * Retorna uma função que captura erros predefinidos durante a execução da função fornecida,
 * e armazena o erro em uma variável de estado.
 *
 * @param routine Função de entrada
 * @param {Function[]} errorsToCatch Erros a serem capturados. Deve ser uma lista de classes de erro.
 * @param {Ref<unknown>} errorRef variável de estado para se armazenar os erros ocorridos
 * @param {boolean} [mustReThrow=false] Relançar os erros capturados (`false` por padrão)
 * @returns {UseErrorCapturingReturn<This, Args, Return>} A função de entrada com captura de erros
 * e a variável de estado.
 */
export const useErrorCapturing = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  errorsToCatch: Function[],
  errorRef?: Ref<unknown>,
  mustReThrow = false,
): UseErrorCapturingReturn<This, Args, Return> => {
  /**
   * Variável de estado para se armazenar os erros ocorridos
   */
  const error = errorRef || ref(null);

  /**
   * Função de entrada com captura de erros
   */
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
      if (mustReThrow) throw e;
      return Promise.reject(e);
    }
  }

  return [routineWithErrorCapturing, error] as const;
};
