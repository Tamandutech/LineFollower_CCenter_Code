import 'pinia';

declare module 'pinia' {
  export interface PiniaCustomProperties {
    // by using a setter we can allow both strings and refs
    get service(): import('firebase/auth').Auth;
    get github_provider(): import('firebase/auth').GithubAuthProvider;
  }
}
