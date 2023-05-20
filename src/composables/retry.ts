import { ref, unref } from 'vue';
import type { Ref } from 'vue';

/**
 * Retorna uma função que re-executa a função fornecida caso certos erros
 * ocorram durante a execução. Caso a função fornecida tenha um nome, ele será
 * preservado, caso contrário a nova função será a
 * propriedade `autoRetriedRoutine` do objeto retornado.
 *
 * @param routine Função para aplicar autoretry
 * @param retryFor Tipos de erro para capturar e executar a função novamente
 * @param maxRetries Número máximo de tentativas
 * @param delay Interválo de tempo entre as tentativas em milissegundos
 * @returns Função com autoretry automático e controlador para o `delay`
 */
export const useRetry = <This, Args extends unknown[], Return>(
  routine: (this: This, ...args: Args) => Promise<Return>,
  // eslint-disable-next-line @typescript-eslint/ban-types
  retryFor: Function[],
  maxRetries: Ref<number> | number,
  delay?: number
) => {
  const retryDelay = ref(delay || 0);

  return {
    [routine.name || 'autoRetriedRoutine']: async function (
      this: This,
      ...args: Args
    ): Promise<Return> {
      let tries = unref(maxRetries);
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

          if (retryDelay.value > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay.value)
            );
          }
        }
      }
    },
    delay: retryDelay,
  };
};
