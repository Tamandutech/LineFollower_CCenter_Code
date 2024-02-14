import 'pinia';

declare module 'pinia' {
  export interface PiniaCustomProperties {
    service: import('firebase/auth').Auth;
    github_provider: import('firebase/auth').GithubAuthProvider;
    ble: import('src/services/ble').RobotBLEAdapter;
    firestore: import('firebase/firestore').Firestore;
    router: import('vue-router').Router;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export interface DefineStoreOptionsBase<S, Store> {
    sync?: {
      collection: string;
      doc: string | keyof S;
      fields: Map<keyof S, { field: string; ref?: string }>;
      create: boolean;
    };
  }
}
