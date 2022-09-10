declare namespace LFCommandCenter {
  interface RobotResponse {
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
    provider: import('firebase/auth').GithubAuthProvider;
  };
  type FirebaseBackend = {
    app: import('firebase/app').FirebaseApp;
    auth: AuthService;
  };
}
