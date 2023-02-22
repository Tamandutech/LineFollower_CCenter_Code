import { task } from 'src/stores/commandQueue';

export const sendCommand = task(
  async function (
    ble: Bluetooth.BLEInterface,
    command: string,
    characteristicId: string
  ) {
    return ble.send(characteristicId, command);
  },
  'sendMessage',
  { bind: true }
);
