import { v4 as uuidv4 } from 'uuid';
import { ref, computed } from 'vue';
import { RuntimeError, BleError } from 'src/services/ble/errors';
import { useErrorCapturing } from './error';
import type { ComputedRef, Ref } from 'vue';

export const useRobotDataStream = (
  ble: Bluetooth.BLEInterface,
  streamCharacteristicId: string,
  txCharacteristicId: string,
  rxCharacteristicId: string,
  streamReader: (values: Robot.RuntimeStream[]) => void
): {
  isStreamActive: ComputedRef<boolean>;
  start: (parameter: string, interval: number) => Promise<void>;
  stop: (parameter: string) => Promise<boolean>;
  stopAll: () => Promise<void>;
  error: Ref<unknown>;
  errorCaptured: Ref<boolean>;
} => {
  const parametersInStream = ref<Map<string, number>>(new Map());
  const isStreamActive = computed<boolean>(
    () => parametersInStream.value.size > 0
  );
  const error = ref<unknown>();
  const errorCaptured = ref(false);

  const streamObserverUuid = uuidv4();
  ble.addTxObserver(streamCharacteristicId, streamReader, streamObserverUuid);

  const { routineWithErrorCapturing: start } = useErrorCapturing<
    undefined,
    [string, number],
    void
  >(
    async function (parameter: string, interval: number): Promise<void> {
      if (parametersInStream.value.get(parameter) === interval) {
        return;
      }

      const status = await ble.request(
        txCharacteristicId,
        rxCharacteristicId,
        `start_stream ${parameter} ${interval}`
      );
      if (status === 'OK') {
        parametersInStream.value.set(parameter, interval);
        return;
      }

      throw new RuntimeError({
        message: 'Ocorreu um erro durante a inicialização da transmissão.',
        action: 'Certifique-se de não há transmissão ativa no robô.',
      });
    },
    [BleError],
    error
  );

  const { routineWithErrorCapturing: stop } = useErrorCapturing<
    undefined,
    [string],
    boolean
  >(
    async function (parameter: string): Promise<boolean> {
      if (!isStreamActive.value) {
        return;
      }

      const status = await ble.request(
        txCharacteristicId,
        rxCharacteristicId,
        `start_stream ${parameter} 0`
      );
      if (status === 'OK') {
        parametersInStream.value.delete(parameter);
        if (parametersInStream.value.size === 0) {
          ble.removeTxObserver(streamCharacteristicId, streamObserverUuid);
        }

        return;
      }

      throw new RuntimeError({
        message: 'Ocorreu um erro durante a finalização da transmissão.',
        action: 'Certifique-se de não há transmissão ativa no robô.',
      });
    },
    [BleError],
    error
  );

  const { routineWithErrorCapturing: stopAll } = useErrorCapturing<
    undefined,
    void[],
    void
  >(
    async function (): Promise<void> {
      for (const parameter of parametersInStream.value.keys()) {
        await stop.call(this, parameter);
      }
    },
    [BleError],
    error,
    true
  );

  return { isStreamActive, start, stop, stopAll, error, errorCaptured };
};
