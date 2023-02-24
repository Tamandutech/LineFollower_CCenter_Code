import { useLoading } from './loading';
import { useErrorCapturing } from './error';
import { RuntimeError, BleError } from 'src/services/ble/errors';
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';

export const useRobotParameters = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): {
  dataClasses: Map<string, Robot.DataClass>;
  loading: Ref<boolean>;
  error: Ref<unknown>;
  setParameter: (
    className: string,
    paramName: string,
    value: string | number
  ) => Promise<void>;
  getParameter: (className: string, paramName: string) => Promise<void>;
  listParameters: () => Promise<void>;
} => {
  const dataClasses = reactive(new Map<string, Robot.DataClass>());
  const error = ref<unknown>(null);
  const { loading, notifyLoading } = useLoading();

  function addDataClass(name: string, dataClass: Robot.DataClass): void {
    dataClasses.set(name, dataClass);
  }

  function addParameter(
    className: string,
    parameterName: string,
    value: string | number
  ): void {
    if (!dataClasses.has(className)) addDataClass(className, new Map());

    dataClasses.get(className).set(parameterName, value);
  }

  const { routineWithErrorCapturing: listParameters } = useErrorCapturing(
    notifyLoading(async function () {
      const rawData = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        'param_list'
      );

      const [, ...results] = rawData.slice(0, -1).split('\n');

      results.forEach((line) => {
        const [, className, parameterName, value] = line.match(
          /^\s\d+\s-\s(\w+)\.(\w+):\s(.+)$/
        );
        addParameter(className, parameterName, value);
      });
    }),
    [BleError],
    error
  );

  async function getParameter(className: string, paramName: string) {
    const rawNewValue = await ble.request<string>(
      txCharacteristicId,
      rxCharacteristicId,
      `param_get ${className}.${paramName}`
    );
    addParameter(className, paramName, rawNewValue);
  }

  const { routineWithErrorCapturing: setParameter } = useErrorCapturing(
    async function (
      className: string,
      paramName: string,
      value: string | number
    ) {
      if (dataClasses.get(className).get(paramName) === value) return;

      const status = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        `param_set ${className}.${paramName} ${value.toString()}`
      );

      if (status !== 'OK')
        throw new RuntimeError({
          message: `Ocorreu um erro durante a atualização do ${className}.${paramName}.`,
          action:
            'Recarregue os parâmetros na dashboard para checar o valor atual do parâmetro',
        });
    },
    [BleError],
    error
  );

  return {
    dataClasses,
    loading,
    error,
    setParameter,
    getParameter,
    listParameters,
  };
};
