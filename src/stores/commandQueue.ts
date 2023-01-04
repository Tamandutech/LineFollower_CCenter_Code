/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';

export const useCommandQueue = defineStore('commandQueue', {
  state: () => ({
    pending: [],
    completed: [],
    failed: [],
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
    completeActiveMessage() {
      if (this.active) this.completed.push(this.active);
      this.active = null;
    },
    failActiveMessage() {
      if (this.active) this.failed.push(this.active);
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
