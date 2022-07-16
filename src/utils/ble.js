import { useBluetoothStore } from '../stores/bluetooth';

import { cmdHandlerMap } from './cmd';

const UART_SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';

const UART_RX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const UART_TX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

var robotDevice;
var rxCharacteristic;

const bluetoothStore = useBluetoothStore();
bluetoothStore.setConnected(false);

var tempMsg = '';

export default class BLE {
  static async connect() {
    try {
      console.log('Requisitando dispositivo Bluetooth...');
      robotDevice = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'TT_' }],
        optionalServices: [UART_SERVICE_UUID],
      });
      robotDevice.addEventListener(
        'gattserverdisconnected',
        BLE.onDisconnected
      );

      console.log('Conectando ao servidor GATT...');
      const server = await robotDevice.gatt.connect();

      bluetoothStore.setConnected(true);

      console.log('Buscando serviço UART...');
      const service = await server.getPrimaryService(UART_SERVICE_UUID);

      console.log('Buscando caracteristica TX...');
      const txCharacteristic = await service
        .getCharacteristic(UART_TX_CHARACTERISTIC_UUID)
        .then(console.log('Caracteristica TX encontrada!'));

      console.log('Ativando as notificações...');
      txCharacteristic.startNotifications();

      console.log('Adicionando o evento...');

      txCharacteristic.addEventListener(
        'characteristicvaluechanged',
        BLE.onTxCharacteristicValueChanged
      );

      console.log('Buscando caracteristica RX...');
      rxCharacteristic = await service
        .getCharacteristic(UART_RX_CHARACTERISTIC_UUID)
        .then(console.log('Caracteristica RX encontrada!'));

      BLE.send('param_get speed.accel');
    } catch (error) {
      console.log(error);
    }
  }

  static async onDisconnected(event) {
    // Object event.target is Bluetooth Device getting disconnected.
    console.log('> Bluetooth Device disconnected');
    bluetoothStore.setConnected(false);
    tempMsg = '';
  }

  static async disconnect() {
    if (!robotDevice) {
      return;
    }

    if (robotDevice.gatt.connected) {
      robotDevice.gatt.disconnect();
    }
  }

  static async send(msg) {
    if (!rxCharacteristic) {
      return;
    }

    try {
      let encoder = new TextEncoder();
      rxCharacteristic.writeValue(encoder.encode(msg));
    } catch (error) {
      console.log(error);
    }
  }

  static async onTxCharacteristicValueChanged(event) {
    let receivedData = [];

    console.log('> Recebendo dados...');

    console.log(event.target.value);

    for (var i = 0; i < event.target.value.byteLength; i++) {
      receivedData[i] = event.target.value.getUint8(i);
    }

    const receivedString = String.fromCharCode.apply(null, receivedData);

    tempMsg += receivedString;

    if (receivedString.charAt(receivedString.length - 1) === '\0') {
      console.log(JSON.parse(tempMsg.substring(0, tempMsg.length - 1)));
      // mandar para o interpretador
      const received = JSON.parse(tempMsg.substring(0, tempMsg.length - 1));

      cmdHandlerMap.get(received.cmdExecd)(received.data);

      tempMsg = '';
    }
  }
}
