import { RuntimeError } from 'src/services/ble/errors';
import { type Ref, ref } from 'vue';
import {
  mapToObject,
  objectToMap,
} from 'src/services/firebase/firestore/utils';

export type UseRobotParametersReturn = {
  /**
   * Lista de classes de dados do robô.
   */
  dataClasses: Ref<Robot.Parameters>;

  /**
   * Lista os parâmetros disponíveis no robô.
   *
   * @returns {Promise<void>} `Promise` vazia que resolve quando a listagem é concluída.
   * @throws {RuntimeError} Se ocorrer um erro durante a listagem.
   */
  listParameters: () => Promise<void>;

  /**
   * Obtém o valor de um parâmetro.
   *
   * @param className A classe de dados do parâmetro.
   * @param parameterName O nome do parâmetro.
   * @returns {Promise<void>} `Promise` vazia que resolve quando o valor é obtido.
   * @throws {RuntimeError} Se ocorrer um erro durante a obtenção do valor.
   */
  getParameter: (className: string, parameterName: string) => Promise<void>;

  /**
   * Define o valor de um parâmetro.
   *
   * @param className A classe de dados do parâmetro.
   * @param parameterName O nome do parâmetro.
   * @param value O valor do parâmetro.
   * @returns {Promise<void>} `Promise` vazia que resolve quando o valor é definido.
   * @throws {RuntimeError} Se ocorrer um erro durante a definição do valor.
   */
  setParameter: (
    className: string,
    parameterName: string,
    value: Robot.ParameterValue
  ) => Promise<void>;

  /**
   * Instala os parâmetros no robô (define todos os parâmetros contidos na versão fornecida).
   *
   * @param dataClassesToInstall A lista de classes de dados a serem instaladas.
   * @returns {Promise<void>} `Promise` vazia que resolve quando a instalação é concluída.
   * @throws {RuntimeError} Se ocorrer um erro durante a instalação.
   */
  installParameters: (dataClassesToInstall: Robot.Parameters) => Promise<void>;
};

/**
 * Conversor dos parâmetros do robô para o formato de objeto esperado pelo Firestore.
 */
export const profileConverter = { to: mapToObject, from: objectToMap };

/**
 * Hook para manipulação dos parâmetros do robô.
 *
 * @param ble Adaptador para comunicação bluetooth
 * @param txCharacteristicId ID da característica de transmissão
 * @param rxCharacteristicId ID da característica de recepção
 * @returns {UseRobotParametersReturn}
 */
export const useRobotParameters = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): UseRobotParametersReturn => {
  const dataClasses = ref<Robot.Parameters>(new Map());

  function addDataClass(name: string, dataClass: Robot.DataClass): void {
    dataClasses.value.set(name, dataClass);
  }

  function valueToString(value: Robot.ParameterValue): string {
    let valueStr = '';
    valueStr = value.toString();
    if (typeof value === 'number' && value < 0) {
      valueStr = '!' + valueStr;
    }
    return valueStr;
  }

  function addParameter(
    className: string,
    parameterName: string,
    value: Robot.ParameterValue
  ): void {
    if (!dataClasses.value.has(className)) addDataClass(className, new Map());

    dataClasses.value.get(className).set(parameterName, value);
  }

  async function listParameters() {
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
  }

  async function getParameter(className: string, parameterName: string) {
    const rawNewValue = await ble.request<string>(
      txCharacteristicId,
      rxCharacteristicId,
      `param_get ${className}.${parameterName}`
    );
    addParameter(className, parameterName, rawNewValue);
  }

  async function setParameter(
    className: string,
    parameterName: string,
    value: Robot.ParameterValue
  ) {
    if (dataClasses.value.get(className)?.get(parameterName) === value) return;

    const status = await ble.request<string>(
      txCharacteristicId,
      rxCharacteristicId,
      `param_set ${className}.${parameterName} ${valueToString(value)}`
    );
    if (status !== 'OK') {
      throw new RuntimeError({
        message: `Ocorreu um erro durante a atualização do ${className}.${parameterName}.`,
        action:
          'Recarregue os parâmetros na dashboard para checar o valor atual do parâmetro',
      });
    }
  }

  async function installParameters(
    dataClassesToInstall: Robot.Parameters
  ): Promise<void> {
    for (const [className, parameters] of dataClassesToInstall.entries()) {
      for (const [parameterName, value] of parameters.entries()) {
        try {
          await setParameter(className, parameterName, value);
        } catch (error) {
          if (error instanceof RuntimeError) {
            throw new RuntimeError({
              message: 'Ocorreu um erro durante a atualização dos parâmetros.',
              action:
                'A escrita dos parâmetros não foi completa. Recarregue os parâmetros na dashboard para checar os valores atuais.',
            });
          } else {
            throw error;
          }
        }

        /**
         * Dar um tempo para o robô concluir o processamento do último comando
         */
        // await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    await listParameters();
  }

  return {
    dataClasses,
    setParameter,
    getParameter,
    listParameters,
    installParameters,
  };
};
