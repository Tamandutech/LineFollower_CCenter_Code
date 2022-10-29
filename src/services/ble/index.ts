import { v4 as uuidv4 } from 'uuid';
import { inject, markRaw, ref } from 'vue';
import type { PiniaPlugin } from 'pinia';
import type { App } from 'vue';

/**
 * Hardcodado pois os serviços para o envio de comandos via
 * bluetooth foram implementados apenas no Braia
 */
const ROBOTS: LFCommandCenter.RobotBluetoothId[] = [
  {
    name: 'Braia Pro',
    services: new Map([
      [
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        new Map([
          ['UART_RX', '6e400002-b5a3-f393-e0a9-e50e24dcca9e'],
          ['UART_TX', '6e400003-b5a3-f393-e0a9-e50e24dcca9e'],
          // ['STREAM_TX', '3A8328FC-3768-46D2-B371-B34864CE8025'],
        ]),
      ],
    ]),
    device: null,
  },
];

export class BLE {
  _characteristics: Map<string, BluetoothRemoteGATTCharacteristic>;
  _cache: string;
  _txObservers: LFCommandCenter.TxObservers;
  _robot: LFCommandCenter.RobotBluetoothId;
  _decoder = new TextDecoder();
  _encoder = new TextEncoder();
  _messages: Map<string, Map<string, string[]>>;

  constructor() {
    this._characteristics = new Map();
    this._cache = '';
    this._txObservers = new Map();
    this._messages = new Map();
  }

  async connect(robot: LFCommandCenter.RobotBluetoothId = ROBOTS[0]) {
    this._robot = robot;

    try {
      this._robot.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'TT_' }],
        optionalServices: [...robot.services.keys()],
      });
      if (!this._robot.device) {
        throw new Error('Seguidor de Linha não encontrado.');
      }

      this._robot.device.addEventListener(
        'gattserverdisconnected',
        this._onDisconnect
      );
      const robotGattServer = await this._robot.device.gatt.connect();

      robot.services.forEach(async (characteristics, uuid) => {
        const uartService = await robotGattServer.getPrimaryService(uuid);
        characteristics.forEach(async (uuid, id) => {
          const characteristic = await uartService.getCharacteristic(uuid);
          this._characteristics.set(id, characteristic);
          this._messages.set(id, new Map());

          if (id.endsWith('TX')) {
            characteristic.addEventListener(
              'characteristicvaluechanged',
              this._handleChunck.bind(this)
            );

            this._txObservers.set(id, new Map());

            await characteristic.startNotifications();
          }
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }

  get connected() {
    return this._robot?.device?.gatt.connected;
  }

  disconnect() {
    if (!this._robot.device.gatt.connected) return;

    this._robot.device.gatt.disconnect();
  }

  decode(buffer: ArrayBufferLike) {
    return this._decoder.decode(buffer);
  }

  encode(message: string) {
    return this._encoder.encode(message);
  }

  /**
   * Envia uma mensagem através de uma characterística.
   *
   * @param id Id da characterística pela qual a mensagem será enviada.
   * @param message Mensagem a ser enviada.
   * @param observer Caso fornecido, será adicionado como observer da característica .
   * @param uuid Caso fornecido, será usado como uuid do observer.
   * @returns `Promise<BLE>`
   */
  async send(
    id: string,
    message: string,
    observer: LFCommandCenter.CharacteristicObserver = undefined,
    uuid: string = undefined
  ) {
    try {
      if (!this._characteristics) {
        throw new Error('Característica RX não encontrada.');
      }

      await this._characteristics
        .get('UART_RX')
        .writeValueWithoutResponse(this.encode(message));

      if (observer) {
        this.addTxObserver(id, observer, uuid);
      }

      Promise.resolve(this);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  _clearCache() {
    this._cache = '';
  }

  _cacheData(value: string) {
    this._cache += value;
  }

  _onDisconnect() {
    this._cache = '';
    if (this._txObservers) {
      this._txObservers.clear();
    }
    if (this._messages) {
      this._txObservers.clear();
    }
    if (this._characteristics) {
      this._characteristics.clear();
    }

    this._robot = null;
  }

  _pushMessage(characteristicId: string) {
    this._messages.get(characteristicId).forEach((messageQueue) => {
      messageQueue.push(this._cache);
    });
    return this._clearCache();
  }

  _sendMessages(characteristicId: string) {
    this._txObservers.get(characteristicId).forEach((observer, uuid) => {
      this._messages
        .get(characteristicId)
        .get(uuid)
        .forEach((rawMessage) => {
          observer(JSON.parse(rawMessage));
        });
    });
  }

  _handleChunck(event: Event) {
    const characteristic = event.target as BluetoothRemoteGATTCharacteristic;

    const data = this.decode(new Uint8Array(characteristic.value.buffer));
    if (data.indexOf('\0') === -1) {
      return this._cacheData(data);
    }

    this._cacheData(data.split('\0').at(0));
    const [id] = [...this._characteristics.entries()].find(([, tx]) => {
      return tx.uuid === characteristic.uuid;
    });
    this._pushMessage(id);
    this._cacheData(data.slice(data.indexOf('\0') + 1));

    return this._sendMessages(id);
  }

  addTxObserver(
    txCharacteristicId: string,
    observer: LFCommandCenter.CharacteristicObserver,
    uuid: string = undefined
  ) {
    if (!uuid) {
      uuid = uuidv4();
    }

    this._txObservers.get(txCharacteristicId).set(uuid, observer);
    this._messages.get(txCharacteristicId).set(uuid, []);

    return this.removeTxObserver.bind(this, uuid, txCharacteristicId);
  }

  /**
   * Remove o observer de uma characterística.
   *
   * @param observerUuid Uuid do observer registrado para a characterística
   * @param txCharacteristicId Id da characterística (e.g. UART_TX)
   * @returns `true` caso o observer tenha sido removido, `false` caso contrário
   */
  removeTxObserver(observerUuid: string, txCharacteristicId: string) {
    this._messages.get(txCharacteristicId).delete(observerUuid);
    return this._txObservers.get(txCharacteristicId).delete(observerUuid);
  }
}

export const plugin = {
  install(app: App) {
    const ble = new BLE();
    app.config.globalProperties.$ble = ble;
    const connected = ref(false);
    const connecting = ref(false);
    const error = ref('');
    app.provide<LFCommandCenter.UseBLE>(key, {
      ble,
      connected: connected,
      connecting: connecting,
      error: error,
      connect: async () => {
        connecting.value = true;
        try {
          await ble.connect();
          connected.value = true;
        } catch (e) {
          connected.value = false;
          error.value = e.toString();
        } finally {
          connecting.value = false;
        }
        return Promise.resolve();
      },
      disconnect: () => {
        connected.value = false;
        ble.disconnect();
      },
    });
  },
};

export const piniaPlugin = (service: BLE): PiniaPlugin => {
  return () => ({ ble: markRaw(service) });
};

const key = Symbol('ble');
export default () => inject<LFCommandCenter.UseBLE>(key);
