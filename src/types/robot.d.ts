declare namespace Robot {
  enum Status {
    CAR_IN_CURVE = 0,
    CAR_IN_LINE = 1,
    CAR_STOPPED = 2,
  }

  interface Response<T> extends Record<string, unknown> {
    cmdExecd: string;
    data: T;
  }

  type Parameter = {
    class: DataClass;
    name: string;
    value: unknown;
  };

  type RegMap = {
    id: number;
    encMedia: number;
    time: number;
    encRight: number;
    encLeft: number;
    status: Status;
    trackStatus: number;
  };

  type RuntimeStream = Array<{
    name: string;
    value: number;
    interval: number;
  }>;

  type DataClass = {
    name: string;
    parameters: Parameter[];
  };

  type BluetoothConnectionConfig = {
    name: string;
    services: Map<string, Map<string, string>>;
  };

  type CommandReceiver<ObserverType = Bluetooth.CharacteristicObserver> = (
    ble: Bluetooth.BLEInterface,
    observer: ObserverType
  ) => Promise<typeof Bluetooth.removeTxObserver>;
}