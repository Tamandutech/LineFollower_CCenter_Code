/**
 * Retorna uma `Promise` que rejeita caso a `Promise` passada não
 * resolva dentro do tempo especificado.
 *
 * @param {Promise<T>} promise A `Promise` a ser executada.
 * @param {Number} milliseconds Tempo máximo em milissegundos para a `Promise` ser resolvida.
 * @param reason Motivo da rejeição da `Promise` caso o tempo expire.
 * @returns {Promise<T>} A `Promise` passada como parâmetro com um tempo limite.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  milliseconds: number,
  reason?: unknown,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(reason), milliseconds),
    ),
  ]);
}
