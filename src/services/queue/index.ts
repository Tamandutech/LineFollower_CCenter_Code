import { PiniaPluginContext } from 'pinia';
import { markRaw } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export class Task<T extends (...args: Parameters<T>) => ReturnType<T>>
  implements Queue.ITask<T>
{
  protected _name: string;
  protected _options: Queue.TaskOptions | undefined;
  protected _routine: T;
  protected _broker: Queue.IBroker;

  constructor(
    routine: T,
    name: string = undefined,
    broker: Queue.IBroker,
    options: Queue.TaskOptions = undefined
  ) {
    this._routine = routine;
    this._name = name ? name : routine.name;
    this._broker = broker;
    this._options = options;
  }

  get name() {
    return this._name;
  }

  get options() {
    return this._options;
  }

  get routine() {
    return this._routine;
  }

  get broker() {
    return this._broker;
  }

  async apply(...args: Parameters<T>): Promise<ReturnType<T>> {
    return this._routine(...args);
  }

  delay(args: Parameters<T>, receiver?: Queue.MessageReceiver<ReturnType<T>>) {
    if (receiver && this.options.bind) {
      receiver = receiver.bind(this);
    }

    return this._broker.pushMessages(new Message<T>(args, this, receiver));
  }
}

export class Message<T extends (...args: Parameters<T>) => ReturnType<T>>
  implements Queue.IMessage<T>
{
  protected _error: string | undefined;
  protected _task: Queue.ITask<T>;
  protected _id: string;
  protected _result: ReturnType<T> | undefined;
  protected _receiver?: Queue.MessageReceiver<ReturnType<T>>;
  protected _args: Parameters<T>;

  constructor(
    args: Parameters<T>,
    task: Queue.ITask<T>,
    receiver?: Queue.MessageReceiver<ReturnType<T>>
  ) {
    this._args = args;
    this._task = task;
    this._receiver = receiver;
    this._id = uuidv4();
  }

  get id() {
    return this._id;
  }

  get result() {
    return this._result;
  }

  get args() {
    return this._args;
  }

  get task() {
    return this._task;
  }

  get receiver() {
    return this._receiver;
  }

  get error() {
    return this._error;
  }

  set error(value: unknown) {
    if (value instanceof Error) {
      this._error = value.message;
    } else if (typeof value === 'string') {
      this._error = value;
    } else {
      this._error = value.toString();
    }
  }

  async resolve() {
    try {
      this._result = await this._task.apply(...this._args);
      return Promise.resolve(this._receiver && this._receiver(this._result));
    } catch (error) {
      this.error = error;
      return Promise.reject(error);
    }
  }
}

export const piniaPlugin = (storeId: string) => {
  return ({ store }: PiniaPluginContext) => {
    const run = async () => {
      for (const message of store.pullPendingMessages()) {
        store.active = message;
        try {
          await store.active.resolve();
          store.completeActiveMessage();
        } catch (error) {
          store.failActiveMessage();
        }
      }
    };

    const task = <T extends (...args: Parameters<T>) => ReturnType<T>>(
      routine: T,
      name: string = null,
      options: Queue.TaskOptions = null
      // @ts-ignore: Unreachable code error
    ) => new Task<T>(routine, name, store, options);

    if (storeId === 'commandQueue') {
      store.$onAction(async ({ name, after, onError }) => {
        if (!['pushMessages', 'unlock'].includes(name)) return;

        after(run);

        onError(
          (error) => error instanceof Error && console.error(error.message)
        );
      });

      return { task: markRaw(task) };
    } else if (storeId === 'robotQueue') {
      store.$onAction(async ({ store, name, after, onError }) => {
        if (name !== 'setActiveCommand') return;

        after(async () => {
          try {
            await store.active.execute();
          } catch (error) {
            store.active.error = error;
            store.addFailedCommand(store.active);
          } finally {
            store.startNextCommand();
          }
        });

        onError(
          (error) => error instanceof Error && console.error(error.message)
        );
      });
    }
  };
};
