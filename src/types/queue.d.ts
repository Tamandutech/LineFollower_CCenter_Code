declare namespace Queue {
  type MessageReceiver<T> = ({
    result,
    error,
  }: {
    result?: T;
    error?: unknown;
  }) => void;

  type TaskOptions = {
    bind: boolean;
    [option: string]: string | number | boolean | Record<string, unknown>;
  };

  interface ITask<T extends (...args: Parameters<T>) => ReturnType<T>> {
    readonly routine: T;
    readonly name: string;
    readonly apply: (...args: Parameters<T>) => Promise<ReturnType<T>>;
    readonly delay: (
      args: Parameters<T>,
      receiver?: Queue.MessageReceiver<ReturnType<T>>
    ) => void;
    readonly broker: IBroker;
    readonly options: TaskOptions | undefined;
  }

  interface IMessage<T extends (...args: Parameters<T>) => ReturnType<T>> {
    readonly task: ITask<T>;
    readonly id: string;
    readonly result?: ReturnType<T>;
    readonly receiver?: MessageReceiver<ReturnType<T>>;
    readonly args: Parameters<T>;
    readonly resolve: (...args: Parameters<T>) => Promise<void>;
    error: unknown;
  }

  interface IBroker {
    pushMessages: <T extends (...args: Parameters<T>) => ReturnType<T>>(
      ...messages: IMessage<T>[]
    ) => void;
    failActiveMessage: <
      T extends (...args: Parameters<T>) => ReturnType<T>
    >() => void;
    completeActiveMessage: <
      T extends (...args: Parameters<T>) => ReturnType<T>
    >() => void;
    lock: () => void;
    unlock: () => void;
  }
}
