import { task } from 'src/stores/commandQueue';

export const sendCommand = task(
  async function (
    ble: Bluetooth.BLEInterface,
    command: string,
    characteristicId: string
  ) {
    try {
      return ble.send(characteristicId, command);
    } catch (error) {
      return Promise.reject(error);
    }
  },
  'sendMessage',
  { bind: true }
);
