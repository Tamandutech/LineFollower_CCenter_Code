import { useBluetooth } from 'stores/bluetooth';
import { useRobotQueue } from 'stores/robotQueue';

const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

const UART_RX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

const bluetooth = useBluetooth();
const robotQueue = useRobotQueue();

bluetooth.setDisconnected();

let robotDevice: BluetoothDevice;
let rxCharacteristic: BluetoothRemoteGATTCharacteristic;
let tempMsg = '';

export default class BLE {
  static connect() {
    try {
      console.log('Requisitando dispositivo Bluetooth...');

      navigator.bluetooth
        .requestDevice({
          filters: [{ namePrefix: 'TT_' }],
          optionalServices: [UART_SERVICE_UUID],
        })
        .then((device: BluetoothDevice) => {
          device.addEventListener('gattserverdisconnected', BLE.onDisconnected);
          robotDevice = device;
          console.log('Conectando ao servidor GATT...');
          return device.gatt.connect();
        })
        .then((server) => {
          bluetooth.setConnecting();
          console.log('Obtendo serviço UART...');
          return server.getPrimaryService(UART_SERVICE_UUID);
        })
        .then((uartService) => {
          console.log('Obtendo característica RX...');
          uartService.getCharacteristic(UART_RX_CHARACTERISTIC_UUID).then((characteristic) => {
            rxCharacteristic = characteristic;
            console.log('Característica RX obtida.');
          });

          console.log('Obtendo característica TX...');
          uartService.getCharacteristic(UART_TX_CHARACTERISTIC_UUID).then((characteristic) => {
            console.log('Característica TX obtida.');
            characteristic.startNotifications();
            characteristic.addEventListener('characteristicvaluechanged', BLE.onTxCharacteristicValueChanged);
          });
        })
        .then(() => {
          bluetooth.setConnected();
        });
    } catch (error) {
      console.log(error);
      bluetooth.setDisconnected();
    }
  }

  static onDisconnected() {
    console.log('> Bluetooth Device disconnected');
    bluetooth.setDisconnected();
    tempMsg = '';
  }

  static disconnect() {
    if (!robotDevice) {
      return;
    }

    if (robotDevice.gatt.connected) {
      robotDevice.gatt.disconnect();
    }
  }

  static async send(msg: string) {
    console.log('> send: ' + msg);

    if (!rxCharacteristic) {
      return Promise.reject('Característica RX não encontrada.');
    }

    await rxCharacteristic
      .writeValue(new TextEncoder().encode(msg))
      .catch((error) => {
        console.log(error);
        return Promise.reject(error);
      })
      .then(() => {
        console.log('> Mensagem enviada.');
        return Promise.resolve();
      });
  }

  static onTxCharacteristicValueChanged(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;
    const receivedData = [];

    console.log('> Recebendo dados...');

    console.log(characteristic.value);

    for (let i = 0; i < characteristic.value.byteLength; i++) {
      receivedData[i] = characteristic.value.getUint8(i);
    }

    const receivedString = String.fromCharCode.apply(null, receivedData);

    tempMsg += receivedString;

    if (receivedString.charAt(receivedString.length - 1) === '\0') {
      console.log(JSON.parse(tempMsg.substring(0, tempMsg.length - 1)));

      const received = JSON.parse(tempMsg.substring(0, tempMsg.length - 1));
      // RobotCommandsMap.get(received.cmdExecd.split(' ')[0])(received);

      robotQueue.active.setResponse(received);

      tempMsg = '';
    }
  }
}
