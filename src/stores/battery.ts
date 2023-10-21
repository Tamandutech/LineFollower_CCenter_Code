import { defineStore } from 'pinia';

export const useBattery = defineStore('battery', {
  state: (): Partial<Robot.BatteryStatus> & {
    historic: Omit<Robot.BatteryStatus, 'historic'>[];
    error: Dashboard.ErrorInterface;
  } => ({
    voltage: null,
    time: null,
    historic: [] /** TODO: mostrar isso em um gráfico */,
    error: null,
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
      try {
        const rawValue = await ble.request<string>(
          txCharacteristicId,
          rxCharacteristicId,
          'bat_voltage'
        );
        const [, measurement] = rawValue.match(/(\d+\.*\d+)\w+/);
        this.$patch((state) => {
          state.voltage = Number(measurement);
          state.time = new Date();
        });
      } catch (error) {
        this.$patch((state) => {
          state.error = error as Dashboard.ErrorInterface;
          state.time = new Date();
        });
      } finally {
        this.$patch((state) => {
          state.historic.push(
            JSON.parse(
              JSON.stringify({
                time: state.time,
                voltage: state.voltage,
                error: state.error,
              })
            )
          );
        });
      }
    },
  },
});
