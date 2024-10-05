declare namespace Dashboard {
  interface Settings {
    batteryStatusUpdateInterval: number; // ms
    batteryLowWarningThreshold: number; // mV
    batteryLowWarningInterval: number; // ms
  }

  interface Competition {
    id: string;
    name: string;
    year: string;
  }

  interface Session {
    competitionId: Competition['id'] | null;
    userId: string;
    robot: Robot.BluetoothConnectionConfig;
    settings: Settings;
  }

  type ErrorOptions = { message: string; action: string; cause?: Error };

  interface ErrorInterface extends Error {
    readonly message: string;
    readonly action: string;
    readonly cause?: Error;
  }
}
