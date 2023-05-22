import { v4 as uuidv4 } from 'uuid';
import { inject, markRaw, ref } from 'vue';
import {
  ConnectionError,
  DeviceNotFoundError,
  CharacteristicWriteError,
} from './errors';
import { ObservableCharacteristic } from './observers';
import { EventEmitter } from './events';
import type { PiniaPlugin } from 'pinia';
import type { App } from 'vue';

export { BleError } from './errors';

/**
 * Hardcodado pois os serviços para o envio de comandos via
 * bluetooth foram implementados apenas no Braia
 */
const ROBOTS: Robot.BluetoothConnectionConfig[] = [
  {
    name: 'Braia Pro',
    services: new Map([
      [
        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        new Map([
          ['UART_RX', '6e400002-b5a3-f393-e0a9-e50e24dcca9e'],
          ['UART_TX', '6e400003-b5a3-f393-e0a9-e50e24dcca9e'],
        ]),
      ],
      [
        '3a8328fb-3768-46d2-b371-b34864ce8025',
        new Map([['STREAM_TX', '3a8328fc-3768-46d2-b371-b34864ce8025']]),
      ],
    ]),
  },
];

export class RobotBLEAdapter implements Bluetooth.BLEInterface {
  _characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();
  _observables: Map<string, ObservableCharacteristic> = new Map();
  _encoder = new TextEncoder();
  _device: BluetoothDevice;
  _emitter: EventEmitter = new EventEmitter(['connect', 'disconnect']);
  _config: Required<Robot.BluetoothConnectionConfig>;

  async connect(
    device: BluetoothDevice,
    config: Required<Robot.BluetoothConnectionConfig> = ROBOTS[0]
  ) {
    this._device = device;
    this._config = config;

    try {
      const robotGattServer = await device.gatt.connect();

      device.addEventListener('gattserverdisconnected', () =>
        this._onDisconnect()
      );

      for (const [uuid, characteristics] of config.services.entries()) {
        const uartService = await robotGattServer.getPrimaryService(uuid);
        for (const [id, uuid] of characteristics.entries()) {
          const characteristic = await uartService.getCharacteristic(uuid);
          this._characteristics.set(id, characteristic);

          if (id.endsWith('TX')) {
            this._observables.set(
              id,
              new ObservableCharacteristic(
                await characteristic.startNotifications()
              )
            );
          }
        }
      }

      this._emitter.emit('connect');
    } catch (error) {
      console.log(error);

      if (error instanceof Error) {
        return Promise.reject(new ConnectionError({ cause: error }));
      }
    }
  }

  get connected() {
    return this._device?.gatt.connected;
  }

  get name() {
    return this._config.name;
  }

  disconnect(): void {
    if (!this._device.gatt.connected) return;
    this._device.gatt.disconnect();
    this._emitter.emit('disconnect');
  }

  _encode(message: string) {
    return this._encoder.encode(message);
  }

  /**
   * Envia uma mensagem através de uma characterística.
   *
   * @param id Id da characterística pela qual a mensagem será enviada.
   * @param message Mensagem a ser enviada.
   * @returns `Promise<never>`
   */
  async send(rxCharacteristicId: string, message: string) {
    if (!this._characteristics.has(rxCharacteristicId)) {
      throw new ConnectionError({
        message: 'Característica RX não encontrada.',
        action: 'Verifique se as características estão disponíveis no robô.',
      });
    }

    try {
      await this._characteristics
        .get(rxCharacteristicId)
        .writeValueWithoutResponse(this._encode(message));
    } catch (error) {
      if (error instanceof Error) {
        return Promise.reject(new CharacteristicWriteError({ cause: error }));
      }
    }
  }

  /**
   * @param txCharacteristicId Característica onde o robô escreverá a resposta
   * @param rxCharacteristicId Caraterística onde o comando será escrito
   * @param command Comando a ser enviado
   * @returns Uma `Promise` que resolve com o novo valor da característica `txCharacteristicId`
   * quando o robô a altera como resposta ao comando enviado. Não chame esse método de forma
   * concorrente (em `.forEach(async () => ...)` ou `Promise.all(...)` por exemplo) pois o robô pode não conseguir processar diversas alterações da característica RX em sequência.
   */
  async request<T>(
    txCharacteristicId: string,
    rxCharacteristicId: string,
    command: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const observerUuid = uuidv4();
      this.addTxObserver(
        txCharacteristicId,
        (response: Robot.Response<T>) => {
          resolve(response.data ?? (response as unknown as T));
          this.removeTxObserver(txCharacteristicId, observerUuid);
        },
        observerUuid
      );

      this.send(rxCharacteristicId, command).catch(reject);
    });
  }

  _onDisconnect() {
    this._characteristics.clear();
    this._emitter.emit('disconnect');
  }

  addTxObserver<T>(
    txCharacteristicId: string,
    observer: Bluetooth.CharacteristicObserver<T>,
    observerUuid: string
  ): () => boolean {
    if (!this.connected) {
      throw new ConnectionError({
        message: 'Não há conexão bluetooth.',
        action: 'Conecte a dashboard a um seguidor de linha.',
      });
    }

    if (!this._observables.has(txCharacteristicId)) {
      throw new ConnectionError({
        message: 'Foram encontrados problemas na comunicação com o robô.',
        action:
          'Verifique se as configurações da interface bluetooth do robô estão corretas.',
      });
    }

    this._observables.get(txCharacteristicId).subscribe(observer, observerUuid);

    return this.removeTxObserver.bind(this, txCharacteristicId, observerUuid);
  }

  /**
   * Remove o observer de uma characterística.
   *
   * @param observerUuid Uuid do observer registrado para a characterística
   * @param txCharacteristicId Id da characterística (e.g. UART_TX)
   * @returns `true` caso o observer tenha sido removido, `false` caso contrário
   */
  removeTxObserver(txCharacteristicId: string, observerUuid: string): boolean {
    return this._observables.get(txCharacteristicId).unsubscribe(observerUuid);
  }

  onConnect(listener: () => void): () => void {
    return this._emitter.listen('connect', listener);
  }

  onDisconnect(listener: () => void): () => void {
    return this._emitter.listen('disconnect', listener);
  }
}

export const plugin = {
  install(app: App) {
    const ble = new RobotBLEAdapter();
    app.config.globalProperties.$ble = ble;

    const connected = ref(false);
    const connecting = ref(false);
    app.provide<Bluetooth.UseBLE>(key, {
      ble,
      connected: connected,
      connecting: connecting,
      connect: async (config: Robot.BluetoothConnectionConfig = ROBOTS[0]) => {
        connecting.value = true;

        try {
          const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'TT_' }],
            optionalServices: [...config.services.keys()],
          });
          if (!device) {
            throw new DeviceNotFoundError();
          }

          await ble.connect(device, config);
          connected.value = true;
        } catch (error) {
          connected.value = false;
          throw error;
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

export const piniaPlugin = (service: RobotBLEAdapter): PiniaPlugin => {
  return () => ({ ble: markRaw(service) });
};

const key = Symbol('ble');
export default () => inject<Bluetooth.UseBLE>(key);
