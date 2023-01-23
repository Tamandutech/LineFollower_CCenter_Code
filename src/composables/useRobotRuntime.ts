import { v4 as uuidv4 } from 'uuid';
import { ref } from 'vue';
import { sendCommand } from 'src/tasks';

export default (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
) => {
  let uuid: string;

  const parameters = ref<Map<string, number>>(new Map());
  const error = ref<unknown>();
  const updateParameters = async () => {
    uuid = uuidv4();

    return new Promise<void>((resolve) => {
      const observer = function (
        this: Queue.ITask<Robot.Command>,
        response: Robot.Response<string>
      ) {
        removeTxObserver();

        const [, ...results] = response.data.toString().split('\n');

        results
          .filter((line) => line !== '')
          .forEach((line) => {
            const [, className, parameterName, value] = line.match(
              /^\s\d+\s-\s(\w+)\.(\w+):\s(-?\d+\.{0,1}\d*)$/
            );

            parameters.value.set(
              `${className}.${parameterName}`,
              Number(value)
            );
          });

        this.broker.unlock();
        resolve();
      };

      let removeTxObserver: () => boolean;
      try {
        removeTxObserver = ble.addTxObserver(
          txCharacteristicId,
          observer.bind(sendCommand),
          uuid
        );
      } catch (e) {
        error.value = e;
        resolve();
      }

      sendCommand.delay(
        [ble, 'runtime_list', rxCharacteristicId],
        async function (this: Queue.ITask<Robot.Command>, { error: e }) {
          if (e) {
            error.value = e;
            return;
          }
          return this.broker.lock();
        }
      );
    });
  };

  return { parameters, error, updateParameters };
};
