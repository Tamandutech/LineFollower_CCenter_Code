import { TimeoutError } from './errors';

/**
 * Retorna uma função que retorna uma promise que rejeita com um erro de timeout.
 *
 * @param {number} milliseconds duração do temporizador em milissegundos
 * @returns {() => Promise<TimeoutError>} uma função que retorna uma promise que rejeita com um erro de timeout
 */
export function getTimer(milliseconds: number): () => Promise<TimeoutError> {
  return async () =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new TimeoutError()), milliseconds)
    );
}
