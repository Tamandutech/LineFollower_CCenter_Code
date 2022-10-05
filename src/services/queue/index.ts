import { PiniaPluginContext } from 'pinia';
import { v4 as uuidv4 } from 'uuid';

export abstract class Task {
  _id: string;
  _name: string;
  _options: Record<string, string | number>;
  _error: string | null;

  constructor(name: string, options: Record<string, string | number> = null) {
    this._name = name;
    this._id = uuidv4();
    if (options) {
      this._options = options;
    }
  }

  get name() {
    return this._name;
  }

  get id() {
    return this._id;
  }

  get options() {
    return this._options;
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

  abstract execute(): Promise<void>;
}

export const piniaPlugin = (storeId: string) => {
  return ({ store }: PiniaPluginContext) => {
    if (store.$id !== storeId) return;

    store.$onAction(async ({ store, name, after, onError }) => {
      if (name !== 'setActiveCommand') return;

      after(async () => {
        try {
          await store.active.execute();
        } catch (error) {
          store.active.error = error;
          store.addFailedCommand(store.active);
        }
        /**
         * TODO: refatorar robotQueue para ser possível rodar a fila aqui sem
         * provocar race condition nos observers de caratísticas do bluetooth.
         */
      });

      onError(
        (error) => error instanceof Error && console.error(error.message)
      );
    });
  };
};
