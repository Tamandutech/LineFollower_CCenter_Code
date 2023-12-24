import { useLoading } from './loading';
import { useErrorCapturing } from './error';
import { BleError } from 'src/services/ble/errors';
import { ref } from 'vue';
export const useRobotSystem = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
) => {
  const error = ref<unknown>(null);
  const { loading, notifyLoading } = useLoading();

  const { pause } = useErrorCapturing(
    notifyLoading(async function () {
      await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        'pause'
      );
    }, 'pause'),
    [BleError],
    error,
    true
  );

  const { resume } = useErrorCapturing(
    notifyLoading(async function () {
      await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        'resume'
      );
    }, 'resume'),
    [BleError],
    error
  );

  return {
    pause,
    resume,
    loading,
    error,
  };
};
