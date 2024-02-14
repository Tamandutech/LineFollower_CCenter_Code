import { RuntimeError } from 'src/services/ble/errors';
import { type Ref, ref } from 'vue';
import { useRefHistory } from '@vueuse/core';

export type NewRecordDto = Omit<Robot.MappingRecord, 'id'> & {
  id?: Robot.MappingRecord['id'];
};

export type UseRobotMappingReturn = {
  /**
   * Lista de registros de mapeamento.
   */
  mappingRecords: Ref<Robot.MappingRecord[]>;

  /**
   * Desfaz a última alteração na lista de registros de mapeamento.
   *
   * @returns {void}
   */
  undo: () => void; // TODO: implementar UI para usar o "undo" e o "redo"

  /**
   * Refaz a última alteração na lista de registros de mapeamento.
   *
   * @returns {void}
   */
  redo: () => void;

  /**
   * Deleta todos os registros de mapeamento da memória flash do robô.
   *
   * @returns {Promise<void>}
   * @throws {RuntimeError} Se ocorrer um erro durante a limpeza dos registros de mapeamento.
   */
  hardDeleteRecords: () => Promise<void>;

  /**
   * Deleta todos os registros de mapeamento da memória RAM do robô.
   *
   * @returns {Promise<void>}
   * @throws {RuntimeError} Se ocorrer um erro durante a limpeza dos registros de mapeamento.
   */
  deleteRecords: () => Promise<void>;

  /**
   * Remove um registro da lista de registros de mapeamento.
   *
   * @param id ID do registro a ser removido
   * @returns {Robot.MappingRecord | null} O registro removido, ou `null` caso não exista um registro com o ID fornecido.
   */
  removeRecord: (id: Robot.MappingRecord['id']) => Robot.MappingRecord | null;

  /**
   * Adiciona um registro à lista de registros de mapeamento.
   *
   * @param record Registro a ser adicionado
   * @returns {void}
   */
  addRecord: (record: NewRecordDto) => void;

  /**
   * Envia os registros de mapeamento para o robô.
   *
   * @param records Lista de registros de mapeamento a serem enviados
   * @returns {Promise<void>}
   * @throws {RuntimeError} Se ocorrer um erro durante o envio dos registros de mapeamento.
   */
  sendMapping: (records?: Robot.MappingRecord[]) => Promise<void>;

  /**
   * Salva os registros de mapeamento na memória flash do robô.
   *
   * @returns {Promise<void>}
   * @throws {RuntimeError} Se ocorrer um erro durante o salvamento dos registros de mapeamento.
   */
  saveMapping: () => Promise<void>;

  /**
   * Busca os registros de mapeamento do robô.
   *
   * @param fromRam Busca os registros de mapeamento da memória RAM do robô
   * @returns {Promise<void>}
   * @throws {RuntimeError} Se ocorrer um erro durante a leitura dos registros de mapeamento.
   */
  fetchMapping: (fromRam: boolean) => Promise<void>;
};

/**
 * Hook para manipulação dos registros de mapeamento do robô.
 *
 * @param ble Adaptador para comunicação bluetooth
 * @param txCharacteristicId ID da característica de transmissão
 * @param rxCharacteristicId ID da característica de recepção
 * @returns {UseRobotMappingReturn}
 */
export const useRobotMapping = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
): UseRobotMappingReturn => {
  const mappingRecords = ref<Robot.MappingRecord[]>([]);
  const { undo, redo } = useRefHistory(mappingRecords, { deep: true });

  function deserializeRecord(record: string): Robot.MappingRecord {
    return record.match(
      /(?<id>-?\d+(\.\d+)?),(?<time>-?\d+(\.\d+)?),(?<encMedia>-?\d+(\.\d+)?),(?<trackStatus>-?\d+(\.\d+)?),(?<offset>-?\d+(\.\d+)?)/
    ).groups as unknown as Robot.MappingRecord;
  }

  function serializeRecord(record: Robot.MappingRecord): string {
    return `${record.id},${record.time},${record.encMedia},${record.trackStatus},${record.offset}`;
  }

  async function clearRecords(inRam: boolean): Promise<void> {
    const status = await ble.request<string>(
      txCharacteristicId,
      rxCharacteristicId,
      inRam ? 'map_clear' : 'map_clearFlash'
    );

    if (status !== 'OK') {
      throw new RuntimeError({
        message:
          'Ocorreu um erro no robô durante a limpeza dos registros de mapeamento.',
        action: `Analise os registros de mapeamento salvos na memória ${
          inRam ? 'RAM' : 'flash'
        } para verificar se há dados corrompidos.`,
      });
    }
  }

  async function deleteRecords(): Promise<
    Awaited<ReturnType<typeof clearRecords>>
  > {
    return await clearRecords(true);
  }

  async function hardDeleteRecords(): Promise<
    Awaited<ReturnType<typeof clearRecords>>
  > {
    return await clearRecords(false);
  }

  function removeRecord(
    id: Robot.MappingRecord['id']
  ): Robot.MappingRecord | null {
    const index = mappingRecords.value.findIndex((record) => id == record.id);
    if (index === -1) return null;

    return mappingRecords.value.splice(index, 1).shift();
  }

  function addRecord(
    record: Omit<Robot.MappingRecord, 'id'> & { id?: Robot.MappingRecord['id'] }
  ) {
    mappingRecords.value.push({
      ...record,
      id: (record.id || Number(mappingRecords.value.length)).toString(),
    });
  }

  async function sendMapping(records?: Robot.MappingRecord[]): Promise<void> {
    await deleteRecords();

    records = [
      ...(records || mappingRecords.value).sort(
        (r1, r2) => Number(r1.encMedia) - Number(r2.encMedia)
      ),
    ];

    let sendingStatus: string;
    let mappingPayload: string;
    while (records.length > 0) {
      mappingPayload = '';
      while (true) {
        if (
          !records.at(0) ||
          (mappingPayload + serializeRecord(records.at(0)) + ';').length > 90
        ) {
          break;
        }

        mappingPayload += serializeRecord(records.shift()) + ';';
      }

      sendingStatus = await ble.request(
        txCharacteristicId,
        rxCharacteristicId,
        `map_add ${mappingPayload}`
      );
      if (sendingStatus !== 'OK') {
        throw new RuntimeError({
          message: 'Ocorreu um erro durante o envio do mapeamento.',
          action:
            'Verifique se há algum problema no registro de mapeamento do robô',
        });
      }
    }
  }

  async function saveMapping(): Promise<void> {
    const savingStatus = await ble.request(
      txCharacteristicId,
      rxCharacteristicId,
      'map_SaveRuntime'
    );
    if (savingStatus !== 'OK') {
      throw new RuntimeError({
        message: 'Ocorreu um erro durante o salvamento do mapeamento na flash.',
        action:
          'Verifique se há problemas na escrita de mapeamento na memória flash do robô.',
      });
    }
  }

  async function fetchMapping(fromRam: boolean): Promise<void> {
    const rawMapping = await ble.request<string>(
      txCharacteristicId,
      rxCharacteristicId,
      fromRam ? 'map_getRuntime' : 'map_get'
    );

    try {
      mappingRecords.value =
        rawMapping === ''
          ? []
          : rawMapping
              .slice(0, -1) // Ignora '\n' no final
              .split('\n')
              .map(deserializeRecord);
    } catch {
      throw new RuntimeError({
        message: 'Ocorreu um erro durante a leitura do mapeamento.',
        action:
          'Verifique se há problemas na leitura de mapeamento da memória flash do robô.',
      });
    }
  }

  return {
    mappingRecords,
    undo, // TODO: implementar UI para usar o "undo" e o "redo"
    redo,
    hardDeleteRecords,
    deleteRecords,
    removeRecord,
    addRecord,
    sendMapping,
    saveMapping,
    fetchMapping,
  };
};
