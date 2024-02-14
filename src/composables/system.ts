export type UseRobotSystemReturn = {
  /**
   * Pausa o robô, fazendo ele parar de se mover.
   *
   * @returns `Promise` vazia que resolve quando o robô é pausado
   * @throws {RuntimeError} Se ocorrer um erro durante a pausa do robô.
   */
  pause: () => Promise<void>;

  /**
   * Retoma a execução do robô, fazendo ele voltar a se mover.
   *
   * @returns `Promise` vazia que resolve quando o robô retoma a execução
   * @throws {RuntimeError} Se ocorrer um erro durante a retomada da execução do robô.
   */
  resume: () => Promise<void>;
};

/**
 * Hook para gerenciar o sistema do robô.
 *
 * @param {Bluetooth.BLEInterface} ble Adaptador para comunicação bluetooth
 * @param {string} txCharacteristicId ID da característica de transmissão
 * @param {string} rxCharacteristicId ID da característica de recepção
 * @returns {UseRobotSystemReturn}
 */
export const useRobotSystem = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): UseRobotSystemReturn => {
  async function pause() {
    await ble.request<string>(txCharacteristicId, rxCharacteristicId, 'pause');
  }

  async function resume() {
    await ble.request<string>(txCharacteristicId, rxCharacteristicId, 'resume');
  }

  return {
    pause,
    resume,
  };
};
