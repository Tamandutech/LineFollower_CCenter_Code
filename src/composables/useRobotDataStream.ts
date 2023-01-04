import { sendCommand } from 'src/tasks';
import { v4 as uuidv4 } from 'uuid';
import { ref, computed } from 'vue';

export default (
  ble: Bluetooth.BLEInterface,
  streamCharacteristicId = 'STREAM_TX',
  commandCharacteristicId = 'UART_TX'
) => {
  let streamObserverUuid: string | undefined;

  const parametersInStream = ref<Map<string, number>>(new Map());
  const isStreamActive = computed<boolean>(
    () => parametersInStream.value.size > 0
  );

  const start = (
    parameter: string,
    interval: number,
    reader: (values: Robot.RuntimeStream) => void
  ) => {
    if (parametersInStream.value.get(parameter) === interval) {
      return Promise.resolve();
    }

    const command = `start_stream ${parameter} ${interval}`;

    return new Promise<void>((resolve, reject) => {
      const observerUuid = uuidv4();
      const observer = function (
        this: Queue.ITask<Robot.Command>,
        response: Robot.Response<string>
      ) {
        if (response.cmdExecd === command) {
          removeObserver();

          if (response.data === 'OK') {
            streamObserverUuid = streamObserverUuid || uuidv4();
            ble.addTxObserver(
              streamCharacteristicId,
              reader,
              streamObserverUuid
            );

            parametersInStream.value.set(parameter, interval);

            return resolve();
          }

          return reject();
        }
      };

      const removeObserver = ble.addTxObserver(
        commandCharacteristicId,
        observer,
        observerUuid
      );

      sendCommand.delay([ble, , commandCharacteristicId]);
    });
  };

  const stop = (parameter: string) => {
    if (!isStreamActive.value) {
      throw new Error('Não há transmissão ativa');
    }

    const command = `start_stream ${parameter} 0`;

    return new Promise<boolean>((resolve, reject) => {
      if (!parametersInStream.value.get(parameter)) {
        reject('Transmissão não encontrada.');
      }

      const observerUuid = uuidv4();
      const observer = function (
        this: Queue.ITask<Robot.Command>,
        response: Robot.Response<string>
      ) {
        if (response.cmdExecd === command) {
          removeObserver();

          if (response.data === 'OK') {
            parametersInStream.value.delete(parameter);
            if (parametersInStream.value.size === 0) {
              ble.removeTxObserver(streamObserverUuid, streamCharacteristicId);
            }

            resolve(true);
          }

          resolve(false);
        }
      };

      const removeObserver = ble.addTxObserver(
        commandCharacteristicId,
        observer,
        observerUuid
      );

      sendCommand.delay([ble, , commandCharacteristicId]);
    });
  };

  return { isStreamActive, start, stop };
};
