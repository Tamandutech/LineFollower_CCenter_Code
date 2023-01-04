declare namespace Bluetooth {
  type BleCharacteristicsMap = Map<string, string>;
  type BleServicesMap = Map<string, BleCharacteristicsMap>;

  type CharacteristicObserver<T> = (response: T) => void;
  type ObserverMap = Map<string, unknown>;
  type TxObserverMap = Map<string, ObserverMap>;
  type UseBLE = {
    ble: import('src/services/ble').BLE;
    connected: import('vue').Ref<boolean>;
    connecting: import('vue').Ref<boolean>;
    error: import('vue').Ref<string>;
    connect: (config?: Robot.BluetoothConnectionConfig) => Promise<void>;
    disconnect: () => void;
  };

  function removeTxObserver(
    observerUuid: string,
    txCharacteristicId: string
  ): boolean;

  interface BLEInterface {
    send: (id: string, message: string) => Promise<never>;
    encode: (message: string) => Uint8Array;
    decode: (buffer: ArrayBufferLike) => string;
    addTxObserver: <T>(
      txCharacteristicId: string,
      observer: CharacteristicObserver<T>,
      uuid?: string
    ) => () => ReturnType<typeof removeTxObserver>;
    removeTxObserver: typeof removeTxObserver;
  }
}
