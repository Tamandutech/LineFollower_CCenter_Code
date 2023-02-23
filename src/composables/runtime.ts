import { useErrorCapturing } from './error';
import { BleError } from 'src/services/ble';
import { ref } from 'vue';
import type { Ref } from 'vue';

export const useRobotRuntime = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): {
  parameters: Ref<Map<string, number>>;
  error: Ref<unknown>;
  errorCaptured: Ref<boolean>;
  updateParameters: () => Promise<void>;
} => {
  const parameters = ref<Map<string, number>>(new Map());

  const {
    routineWithErrorCapturing: updateParameters,
    error,
    errorCaptured,
  } = useErrorCapturing(
    async function (): Promise<void> {
      const rawData = await ble.request(
        txCharacteristicId,
        rxCharacteristicId,
        'runtime_list'
      );

      const [, ...results] = rawData.toString().split('\n');

      results
        .filter((line) => line !== '')
        .forEach((line) => {
          const [, className, parameterName, value] = line.match(
            /^\s\d+\s-\s(\w+)\.(\w+):\s(-?\d+\.{0,1}\d*)$/
          );

          parameters.value.set(`${className}.${parameterName}`, Number(value));
        });
    },
    [BleError]
  );

  return { parameters, error, errorCaptured, updateParameters };
};
