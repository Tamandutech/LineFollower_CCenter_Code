import { defineStore } from 'pinia';

export const useBluetooth = defineStore('bluetooth', {
  state: () => ({
    connected: false as boolean,
    connecting: false as boolean,
  }),

  getters: {
    isConnected(): boolean {
      return this.connected;
    },

    isConnecting(): boolean {
      return this.connecting;
    },
  },

  actions: {
    setConnected() {
      this.connected = true;
      this.connecting = false;
    },

    setConnecting() {
      this.connected = false;
      this.connecting = true;
    },

    setDisconnected() {
      this.connected = false;
      this.connecting = false;
    },
  },
});
