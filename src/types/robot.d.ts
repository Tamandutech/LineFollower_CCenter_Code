declare namespace Robot {
  const enum Status {
    CAR_IN_CURVE = 0,
    CAR_IN_LINE = 1,
    CAR_STOPPED = 2,
  }

  const enum MemoryDevices {
    RAM,
    FLASH,
  }

  enum BatteryLevel {
    OK = 'OK',
    LOW = 'LOW',
    CRITIC = 'CRITIC',
  }

  type BatteryStatus = {
    voltage: number; // em mV
    time: Date;
  };

  type ParameterValue = string | number;
  type DataClass = Map<string, ParameterValue>;
  type Parameters = Map<string, DataClass>;

  interface Response<T> extends Record<string, unknown> {
    cmdExecd: string;
    data: T;
  }

  type MappingRecord = {
    id: string;
    encMedia: string;
    time: string;
    offset: string;
    trackStatus: string;
  };
  type Mapping = MappingRecord[];

  type RuntimeStream = {
    name: string;
    value: number | string;
    Time: number;
  };

  type Timestamp = import('firebase/firestore').Timestamp;
  type DocumentReference = import('firebase/firestore').Timestamp;
  type ProfileVersion<T> = {
    id: string;
    description: string;
    created: Timestamp;
    updated: Timestamp;
    robot?: DocumentReference;
    competition?: DocumentReference;
    data: T;
  };

  type BluetoothConnectionConfig = {
    id: string;
    name: string;
    services: Record<string, Record<string, string>>;
    interface: string;
  };

  type Command = (
    ble: Bluetooth.BLEInterface,
    command: string,
    characteristicId: string
  ) => Promise<never>;
}
