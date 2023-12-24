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
import { getTimer } from './utils';

export { BleError } from './errors';

export class RobotBLEAdapter implements Bluetooth.BLEInterface {
  private DEFAULT_TIMEOUT = 5000;

  _characteristics: Map<string, BluetoothRemoteGATTCharacteristic> = new Map();
  _observables: Map<string, ObservableCharacteristic> = new Map();
  _encoder = new TextEncoder();
  _device: BluetoothDevice;
  _emitter: EventEmitter = new EventEmitter(['connect', 'disconnect']);
  _config: Required<Robot.BluetoothConnectionConfig>;

  async connect(
    device: BluetoothDevice,
    config: Required<Robot.BluetoothConnectionConfig>
  ) {
    this._device = device;
    this._config = config;

    try {
      const robotGattServer = await device.gatt.connect();

      device.addEventListener('gattserverdisconnected', () =>
        this._onDisconnect()
      );

      for (const [uuid, characteristics] of Object.entries(config.services)) {
        const uartService = await robotGattServer.getPrimaryService(uuid);
        for (const [id, uuid] of Object.entries(characteristics)) {
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
   * @param timeout Tempo em milissegundos para esperar pela resposta do robô, ou uma função
   * que retorna uma `Promise` que sempre rejeita, para concorrer com
   * a resposta, possibilitando o cancelamento da espera através do lançamento
   * de um erro, por exemplo.
   * @returns Uma `Promise` que resolve com o novo valor da característica `txCharacteristicId`
   * quando o robô a altera como resposta ao comando enviado. Não chame esse método de forma
   * concorrente (em `.forEach(async () => ...)` ou `Promise.all(...)` por exemplo) pois o robô
   * pode não conseguir processar diversas alterações da característica RX em sequência.
   * @throws {BleError} Se ocorrer um erro durante a comunicação com o robô.
   */
  async request<T>(
    txCharacteristicId: string,
    rxCharacteristicId: string,
    command: string,
    timeout: number | (() => Promise<Error>) = this.DEFAULT_TIMEOUT
  ): Promise<T> {
    const timer = typeof timeout === 'number' ? getTimer(timeout) : timeout;

    const promises: [Promise<T>, Promise<Error>] = [
      new Promise((resolve, reject) => {
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
      }),
      timer(),
    ];

    const result = await Promise.race(promises);
    if (result instanceof Error) {
      throw result;
    }
    return result;
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
      connect: async (config: Robot.BluetoothConnectionConfig) => {
        connecting.value = true;

        try {
          const device = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'TT_' }],
            optionalServices: [...Object.keys(config.services)],
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
