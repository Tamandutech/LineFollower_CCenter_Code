import { useLoading } from './loading';
import { useErrorCapturing } from './error';
import { RuntimeError, BleError } from 'src/services/ble/errors';
import { ref } from 'vue';
import {
  mapToObject,
  objectToMap,
} from 'src/services/firebase/firestore/utils';

export const profileConverter = { to: mapToObject, from: objectToMap };

export const useRobotParameters = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
) => {
  const dataClasses = ref<Robot.Parameters>(new Map());
  const error = ref<unknown>(null);
  const { loading, notifyLoading } = useLoading();

  function addDataClass(name: string, dataClass: Robot.DataClass): void {
    dataClasses.value.set(name, dataClass);
  }

  function addParameter(
    className: string,
    parameterName: string,
    value: Robot.ParameterValue
  ): void {
    if (!dataClasses.value.has(className)) addDataClass(className, new Map());

    dataClasses.value.get(className).set(parameterName, value);
  }

  const { listParameters } = useErrorCapturing(
    notifyLoading(async function () {
      const rawData = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        'param_list'
      );

      const [, ...results] = rawData.slice(0, -1).split('\n');

      results.forEach((line) => {
        const [, className, parameterName, value] = line.match(
          /^\s\d+\s-\s(\w+)\.(\w+):\s(.*)$/
        );
        addParameter(className, parameterName, value);
      });
    }, 'listParameters'),
    [BleError],
    error
  );

  const { routineWithErrorCapturing: getParameter } = useErrorCapturing(
    async function (className: string, parameterName: string) {
      const rawNewValue = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        `param_get ${className}.${parameterName}`
      );
      addParameter(className, parameterName, rawNewValue);
    },
    [BleError],
    error
  );

  const { routineWithErrorCapturing: setParameter } = useErrorCapturing(
    async function (
      className: string,
      parameterName: string,
      value: Robot.ParameterValue
    ) {
      if (dataClasses.value.get(className).get(parameterName) === value) return;
      // Corrige problema com parâmetros negativos
      let valueStr ='';
      valueStr = value.toString();
      if(value < 0)
      {
        valueStr = '!' + valueStr;
      }

      const status = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        `param_set ${className}.${parameterName} ${valueStr}`
      );

      if (status !== 'OK') {
        throw new RuntimeError({
          message: `Ocorreu um erro durante a atualização do ${className}.${parameterName}.`,
          action:
            'Recarregue os parâmetros na dashboard para checar o valor atual do parâmetro',
        });
      }
    },
    [BleError],
    error
  );

  const { installParameters } = useErrorCapturing(
    notifyLoading(async function (
      dataClassesToInstall: Robot.Parameters
    ): Promise<void> {
      let status: string;
      for (const [className, parameters] of dataClassesToInstall.entries()) {
        for (const [parameterName, value] of parameters.entries()) {
          if (dataClasses.value.get(className).get(parameterName) === value) {
            continue;
          }
          // Corrige problema com parâmetros negativos
          let valueStr ='';
          valueStr = value.toString();
          if(value < 0)
          {
            valueStr = '!' + valueStr;
          }
          status = await ble.request<string>(
            txCharacteristicId,
            rxCharacteristicId,
            `param_set ${className}.${parameterName} ${valueStr}`
          );
          if (status !== 'OK') {
            throw new RuntimeError({
              message: 'Ocorreu um erro durante a atualização dos parâmetros.',
              action:
                'A escrita dos parâmetros não foi completa. Recarregue os parâmetros na dashboard para checar os valores atuais.',
            });
          }

          /**
           * Dar um tempo para o robô concluir o processamento do último comando
           */
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      await listParameters();
    },
    'installParameters'),
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
    installParameters,
  };
};
