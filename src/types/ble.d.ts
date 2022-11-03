declare namespace Bluetooth {
  type BleCharacteristicsMap = Map<string, string>;
  type BleServicesMap = Map<string, BleCharacteristicsMap>;

  type CharacteristicObserver<T = string> = (
    response: Robot.Response<T>
  ) => void;
  type ObserverMap = Map<string, CharacteristicObserver>;
  type TxObserverMap = Map<string, ObserverMap>;
  type UseBLE = {
    ble: import('src/services/ble').BLE;
    connected: import('vue').Ref<boolean>;
    connecting: import('vue').Ref<boolean>;
    error: import('vue').Ref<string>;
    connect: (config: Robot.BluetoothConnectionConfig) => Promise<void>;
    disconnect: () => void;
  };

  function removeTxObserver(
    observerUuid: string,
    txCharacteristicId: string
  ): boolean;

  interface BLEInterface {
    send: (
      id: string,
      message: string,
      observer?: CharacteristicObserver,
      uuid?: string
    ) => Promise<() => ReturnType<typeof removeTxObserver>>;
    encode: (message: string) => Uint8Array;
    decode: (buffer: ArrayBufferLike) => string;
    addTxObserver: (
      txCharacteristicId: string,
      observer: CharacteristicObserver,
      uuid?: string
    ) => () => ReturnType<typeof removeTxObserver>;
    removeTxObserver: typeof removeTxObserver;
  }
}
