import { defineStore } from 'pinia';

export const useBattery = defineStore('battery', {
  state: () => ({
    voltage: '0.0mV',
  }),

  actions: {
    updateVoltage(value: string) {
      this.voltage = value;
    },
  },
});
