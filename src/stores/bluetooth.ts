import { defineStore } from 'pinia';

export const useBluetoothStore = defineStore('bluetooth', {
  state: () => ({
    connected: false as boolean,
  }),

  getters: {
    isConnected(state) {
      return this.connected;
    },
  },

  actions: {
    setConnected(state: boolean) {
      this.connected = state;
    },
  },
});
