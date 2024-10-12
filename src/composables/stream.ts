import { v4 as uuidv4 } from 'uuid';
import { ref, computed } from 'vue';
import { RuntimeError } from 'src/services/ble/errors';
import type { ComputedRef } from 'vue';

export type UseRobotDataStreamReturn = {
  /**
   * Indica se há alguma transmissão ativa.
   */
  isStreamActive: ComputedRef<boolean>;

  /**
   * Inicia a transmissão de um parâmetro.
   * @param parameter O parâmetro a ser transmitido.
   * @param interval O intervalo de transmissão.
   * @returns {Promise<void>} `Promise` vazia que resolve quando a transmissão é iniciada.
   * @throws {RuntimeError} Se ocorrer um erro durante a transmissão.
   */
  start: (parameter: string, interval: number) => Promise<void>;

  /**
   * Finaliza a transmissão de um parâmetro.
   * @param parameter O parâmetro a ser finalizado.
   * @returns {Promise<boolean>} `Promise` que resolve com `true` se a transmissão foi finalizada, ou `false` caso contrário.
   * @throws {RuntimeError} Se ocorrer um erro durante a finalização da transmissão.
   */
  stop: (parameter: string) => Promise<boolean>;

  /**
   * Finaliza todas as transmissões.
   * @returns {Promise<void>} `Promise` vazia que resolve quando todas as transmissões são finalizadas.
   * @throws {RuntimeError} Se ocorrer um erro durante a finalização da transmissão.
   */
  stopAll: () => Promise<void>;
};

/**
 * Hook para gerenciar a transmissão de dados do robô.
 *
 * @param {Bluetooth.BLEInterface} ble Adaptador para comunicação bluetooth
 * @param {string} streamCharacteristicId ID da característica de transmissão
 * @param {string} txCharacteristicId ID da característica de transmissão
 * @param {string} rxCharacteristicId ID da característica de recepção
 * @param {Function} streamReader Função que recebe os valores transmitidos
 * @returns {UseRobotDataStreamReturn}
 */
export const useRobotDataStream = (
  ble: Bluetooth.BLEInterface,
  streamCharacteristicId: string,
  txCharacteristicId: string,
  rxCharacteristicId: string,
  streamReader: (values: Robot.RuntimeStream[]) => void,
): UseRobotDataStreamReturn => {
  const parametersInStream = ref<Map<string, number>>(new Map());
  const isStreamActive = computed<boolean>(
    () => parametersInStream.value.size > 0,
  );
  const streamObserverUuid = uuidv4();
  ble.addTxObserver(streamCharacteristicId, streamReader, streamObserverUuid);

  async function start(parameter: string, interval: number): Promise<void> {
    if (parametersInStream.value.get(parameter) === interval) {
      return;
    }

    const status = await ble.request(
      txCharacteristicId,
      rxCharacteristicId,
      `start_stream ${parameter} ${interval}`,
    );
    if (status === 'OK') {
      parametersInStream.value.set(parameter, interval);
      return;
    }

    throw new RuntimeError({
      message: 'Ocorreu um erro durante a inicialização da transmissão.',
      action: 'Certifique-se de não há transmissão ativa no robô.',
    });
  }

  async function stop(parameter: string): Promise<boolean> {
    if (!isStreamActive.value) {
      return false;
    }

    const status = await ble.request(
      txCharacteristicId,
      rxCharacteristicId,
      `start_stream ${parameter} 0`,
    );
    if (status === 'OK') {
      parametersInStream.value.delete(parameter);
      if (parametersInStream.value.size === 0) {
        ble.removeTxObserver(streamCharacteristicId, streamObserverUuid);
      }

      return true;
    }

    throw new RuntimeError({
      message: 'Ocorreu um erro durante a finalização da transmissão.',
      action: 'Certifique-se de não há transmissão ativa no robô.',
    });
  }

  async function stopAll(this: undefined): Promise<void> {
    for (const parameter of parametersInStream.value.keys()) {
      await stop.call(this, parameter);
    }
  }

  return { isStreamActive, start, stop, stopAll };
};
