import { defineStore } from 'pinia';

export const useBattery = defineStore('battery', {
  state: (): Partial<Robot.BatteryStatus> & {
    historic: Robot.BatteryStatus[];
  } => ({
    voltage: null,
    time: null,
    historic: [] /** TODO: mostrar isso em um gráfico */,
  }),

  getters: {
    level: (state): Robot.BatteryLevel => {
      if (state.voltage >= 6000) {
        return Robot.BatteryLevel.OK;
      } else if (state.voltage >= 3000) {
        return Robot.BatteryLevel.LOW;
      } else {
        return Robot.BatteryLevel.CRITIC;
      }
    },
  },

  actions: {
    async fetchVoltage(
      ble: Bluetooth.BLEInterface,
      txCharacteristicId: string,
      rxCharacteristicId: string
    ): Promise<void> {
      const rawValue = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        'bat_voltage'
      );

      const [, measurement] = rawValue.match(/(\d+\.*\d+)\w+/);

      return this.$patch((state) => {
        state.voltage = Number(measurement);
        state.time = new Date();
        state.historic.push(JSON.parse(JSON.stringify(state)));
      });
    },
  },
});
