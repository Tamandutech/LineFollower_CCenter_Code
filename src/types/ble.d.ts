declare namespace Bluetooth {
  type Message = Record<string, unknown>;

  type BleCharacteristicsMap = Map<string, string>;
  type BleServicesMap = Map<string, BleCharacteristicsMap>;

  type CharacteristicObserver<T> = (message: T) => void;
  type ObserverMap = Map<string, unknown>;
  type TxObserverMap = Map<string, ObserverMap>;
  type UseBLE = {
    ble: import('src/services/ble').RobotBLEAdapter;
    connected: import('vue').Ref<boolean>;
    connecting: import('vue').Ref<boolean>;
    connect: (
      device: BluetoothDevice,
      config: Robot.BluetoothConnectionConfig
    ) => Promise<void>;
    requestDevice: () => Promise<BluetoothDevice>;
    disconnect: () => void;
  };

  function removeTxObserver(
    txCharacteristicId: string,
    observerUuid: string
  ): boolean;

  interface BLEInterface {
    send: (rxCharacteristicId: string, message: string) => Promise<never>;
    addTxObserver: <T>(
      txCharacteristicId: string,
      observer: CharacteristicObserver<T>,
      observerUuid: string
    ) => () => ReturnType<typeof removeTxObserver>;
    request<T>(
      txCharacteristicId: string,
      rxCharacteristicId: string,
      command: string
    ): Promise<T>;
    removeTxObserver: typeof removeTxObserver;
    connected: boolean;
  }
}
