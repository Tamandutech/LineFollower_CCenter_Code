import { sendCommand } from 'src/tasks';
import { v4 as uuidv4 } from 'uuid';
import { ref, computed } from 'vue';
import { DeviceError } from 'src/services/ble/errors';

export default (
  ble: Bluetooth.BLEInterface,
  streamCharacteristicId: string,
  txCharacteristicId: string,
  rxCharacteristicId: string,
  streamReader: (values: Robot.RuntimeStream[]) => void
) => {
  const parametersInStream = ref<Map<string, number>>(new Map());
  const isStreamActive = computed<boolean>(
    () => parametersInStream.value.size > 0
  );

  const error = ref<unknown>();
  const errorHandler: Queue.MessageReceiver<Promise<never>> = async function (
    this: Queue.ITask<Robot.Command>,
    { error: e }
  ) {
    if (e) {
      error.value = e;
      return;
    }

    return this.broker.lock();
  };

  const streamObserverUuid = uuidv4();
  ble.addTxObserver(streamCharacteristicId, streamReader, streamObserverUuid);

  const start = (parameter: string, interval: number) => {
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
        this.broker.unlock();

        if (response.cmdExecd === command) {
          removeTxObserver();

          if (response.data === 'OK') {
            parametersInStream.value.set(parameter, interval);
            return resolve();
          }

          return reject(new DeviceError());
        }
      };

      let removeTxObserver: () => boolean;
      try {
        removeTxObserver = ble.addTxObserver(
          txCharacteristicId,
          observer.bind(sendCommand),
          observerUuid
        );
      } catch (e) {
        error.value = e;
        resolve();
      }

      sendCommand.delay([ble, command, rxCharacteristicId], errorHandler);
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
        this.broker.unlock();

        if (response.cmdExecd === command) {
          removeObserver();

          if (response.data === 'OK') {
            parametersInStream.value.delete(parameter);
            if (parametersInStream.value.size === 0) {
              ble.removeTxObserver(streamObserverUuid, streamCharacteristicId);
            }

            return resolve(true);
          }

          return reject(new DeviceError());
        }
      };

      const removeObserver = ble.addTxObserver(
        txCharacteristicId,
        observer.bind(sendCommand),
        observerUuid
      );

      sendCommand.delay([ble, command, rxCharacteristicId], errorHandler);
    });
  };

  const stopAll = async () => {
    return Promise.all([...parametersInStream.value.keys()].map(stop));
  };

  return { isStreamActive, start, stop, stopAll, error };
};
