import { type Ref, ref } from 'vue';

export type UseRobotRuntimeReturn = {
  /**
   * Parâmetros de execução do robô.
   */
  parameters: Ref<Map<string, number>>;

  /**
   * Lê os parâmetros do robô e atualiza o valor de `parameters`.
   * @throws {BleError} Caso ocorra um erro na comunicação com o robô
   */
  fetchParameters: () => Promise<void>;
};

/**
 * Hook para obter os parâmetros de execução do robô.
 *
 * @param {Bluetooth.BLEInterface} ble Adaptador para comunicação bluetooth
 * @param {string} txCharacteristicId ID da característica de transmissão
 * @param {string} rxCharacteristicId ID da característica de recepção
 * @returns {UseRobotRuntimeReturn}
 */
export const useRobotRuntime = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): UseRobotRuntimeReturn => {
  const parameters = ref<Map<string, number>>(new Map());

  /**
   * Lê os parâmetros do robô e atualiza o valor de `parameters`.
   * @throws {BleError} Caso ocorra um erro na comunicação com o robô
   */
  async function fetchParameters(): Promise<void> {
    const rawData = await ble.request(
      txCharacteristicId,
      rxCharacteristicId,
      'runtime_list'
    );

    const [, ...results] = rawData.toString().split('\n');

    results
      .filter((line) => line !== '')
      .forEach((line) => {
        const [, className, parameterName, value] = line.match(
          /^\s\d+\s-\s(\w+)\.(\w+):\s(-?\d+\.{0,1}\d*)$/
        );

        parameters.value.set(`${className}.${parameterName}`, Number(value));
      });
  }

  return { parameters, fetchParameters };
};
