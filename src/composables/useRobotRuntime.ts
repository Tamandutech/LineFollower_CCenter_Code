import { sendCommand } from 'src/tasks';
import { v4 as uuidv4 } from 'uuid';
import { ref } from 'vue';

export default (ble: Bluetooth.BLEInterface, characteristicId: string) => {
  let uuid: string;

  const parameters = ref<Map<string, number>>(new Map());
  const updateParameters = () => {
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

      const removeTxObserver = ble.addTxObserver(
        characteristicId,
        observer.bind(sendCommand),
        uuid
      );

      sendCommand.delay(
        [ble, 'runtime_list', characteristicId],
        async function (this: Queue.ITask<Robot.Command>) {
          return this.broker.lock();
        }
      );
    });
  };

  return { parameters, updateParameters };
};
