/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';

export class NoActiveMessageError extends Error {
  readonly message = 'Não há tarefas pendentes na fila.';
}

export const useCommandQueue = defineStore('commandQueue', {
  state: () => ({
    pending: [],
    completed: [],
    failed: new Map(),
    active: null,
    locked: false,
  }),

  actions: {
    setActiveMessage<T extends (...args: Parameters<T>) => ReturnType<T>>(
      message: Queue.IMessage<T>
    ) {
      this.active = message;
    },
    pushMessages<T extends (...args: Parameters<T>) => ReturnType<T>>(
      ...messages: Queue.IMessage<T>[]
    ) {
      return this.pending.push(...messages);
    },
    async completeActiveMessage() {
      if (!this.active) throw new NoActiveMessageError();

      await this.active.resolve();

      this.completed.push(this.active);
      this.active = null;
    },
    failActiveMessage(error: unknown) {
      if (this.active) this.failed.set(this.active, error);
      this.active = null;
    },
    pullPendingMessages: function* <
      T extends (...args: Parameters<T>) => ReturnType<T>
    >(): Iterable<Queue.IMessage<T>> {
      if (this.locked) return;
      yield this.pending.shift();
    },
    lock() {
      this.locked = true;
    },
    unlock() {
      this.locked = false;
    },
  },
});

export const task = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  routine: T,
  name?: string,
  options?: Queue.TaskOptions
) => useCommandQueue().task<T>(routine, name, options);
