import { ref, unref } from 'vue';
import type { Ref } from 'vue';

export type RetryOptions = {
  /**
   * Número máximo de tentativas
   */
  maxRetries: Ref<number> | number;

  /**
   * Interválo de tempo entre as tentativas em milissegundos
   */
  delay?: number;

  /**
   * Aplicar o algoritmo de [backoff exponencial](https://en.wikipedia.org/wiki/Exponential_backoff)
   * no atraso entre as tentativas
   */
  exponentialBackoff?: boolean;
};

export type UseRetryReturn<This, Args extends unknown[], Return> = readonly [
  (this: This, ...args: Args) => Promise<Return>,
  Ref<number>
];

/**
 * Retorna uma função que re-executa a função fornecida caso erros predefinidos
 * ocorram durante a execução.
 *
 * @param {Function} routine Função para aplicar auto-retry
 * @param {Function[]} retryFor Tipos de erro para capturar e executar a função novamente
 * @param {RetryOptions} options Configurações para o auto-retry
 * @returns {UseRetryReturn} Função com retry automático automático e controlador para o `delay`
 */
export const useRetry = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  retryFor: Function[],
  options: RetryOptions
): UseRetryReturn<This, Args, Return> => {
  /**
   * Controlador para o `delay`
   */
  const retryDelay = ref(options.delay || 0);

  /**
   * Função com retry automático
   */
  const autoRetriedRoutine = async function (
    this: This,
    ...args: Args
  ): Promise<Return> {
    let tries = unref(options.maxRetries);
    let currentDelay = unref(retryDelay);
    while (true) {
      tries -= 1;
      try {
        const result = await routine.call(this, ...args);
        return Promise.resolve(result);
      } catch (error) {
        if (
          tries == 0 ||
          !retryFor.some((errorType) => error instanceof errorType)
        ) {
          throw error;
        }

        if (currentDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
        }

        if (options.exponentialBackoff) {
          currentDelay *= 2;
        }
      }
    }
  };

  return [autoRetriedRoutine, retryDelay] as const;
};
