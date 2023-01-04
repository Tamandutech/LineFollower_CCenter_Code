import 'pinia';

declare module 'pinia' {
  export interface PiniaCustomProperties {
    get service(): import('firebase/auth').Auth;
    get github_provider(): import('firebase/auth').GithubAuthProvider;
    ble: import('src/services/ble').BLE;
    task: <T extends (...args: Parameters<T>) => ReturnType<T>>(
      routine: T,
      name: string | null,
      options: Queue.TaskOptions
    ) => Queue.ITask<T>;
    setActiveMessage<T extends (...args: Parameters<T>) => ReturnType<T>>(
      message: Queue.IMessage<T>
    ): void;
    pushMessages<T extends (...args: Parameters<T>) => ReturnType<T>>(
      ...messages: Queue.IMessage<T>[]
    ): void;
    completeActiveMessage(): void;
    failActiveMessage(): void;
    pullPendingMessages<
      T extends (...args: Parameters<T>) => ReturnType<T>
    >(): Iterable<Queue.IMessage<T>>;
  }
}
