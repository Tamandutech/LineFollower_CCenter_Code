declare namespace LFCommandCenter {
  interface RobotResponse extends Record<string, unknown> {
    cmdExecd: string;
    data: string;
  }

  enum RobotStatus {
    CAR_IN_CURVE = 0,
    CAR_IN_LINE = 1,
    CAR_STOPPED = 2,
  }

  type RegMap = {
    id: number;
    encMedia: number;
    time: number;
    encRight: number;
    encLeft: number;
    status: RobotStatus;
    trackStatus: number;
  };

  type DataClass = {
    name: string;
    parameters: RobotParameter[];
  };

  type RobotParameter = {
    class: DataClass;
    name: string;
    value: unknown;
  };

  type AuthService = {
    service: import('firebase/auth').Auth;
    github_provider: import('firebase/auth').GithubAuthProvider;
  };

  type FirebaseBackend = {
    app: import('firebase/app').FirebaseApp;
    auth: AuthService;
  };

  type RobotBleCharacteristicsHashMap = Map<string, string>;
  type RobotBleServicesHashMap = Map<string, RobotBleCharacteristicsHashMap>;

  type CharacteristicObserver = (data: string) => Promise<void>;
  type ObserversHashMap = Map<string, CharacteristicObserver>;
  type TxObservers = Map<string, ObserversHashMap>;
  type UseBLE = {
    ble: import('src/services/ble').BLE;
    connected: import('vue').Ref<boolean>;
    connecting: import('vue').Ref<boolean>;
    error: import('vue').Ref<string>;
    connect: () => Promise<void>;
    disconnect: () => void;
  };

  type RobotBluetoothId = {
    name: string;
    services: RobotBleServicesHashMap;
    device: BluetoothDevice | null;
  };
}
