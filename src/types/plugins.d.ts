import 'pinia';

declare module 'pinia' {
  export interface PiniaCustomProperties {
    get service(): import('firebase/auth').Auth;
    get github_provider(): import('firebase/auth').GithubAuthProvider;
    ble: import('src/services/ble').RobotBLEAdapter;
  }
}
