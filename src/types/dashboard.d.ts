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
    competitionId: Competition['id'];
    userId: string;
    robot: Robot.BluetoothConnectionConfig;
    settings: Settings;
  }
}
