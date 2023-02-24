import { useLoading } from './loading';
import { useRetry } from './retry';
import { useErrorCapturing } from './error';
import { RuntimeError, BleError } from 'src/services/ble/errors';
import { ref } from 'vue';
import { useRefHistory } from '@vueuse/core';

export const useRobotMapping = (
  ble: Bluetooth.BLEInterface,
  txCharacteristicId: string,
  rxCharacteristicId: string
) => {
  const mappingRecords = ref<Robot.MappingRecord[]>([]);
  const error = ref<unknown>(null);
  const { loading, notifyLoading } = useLoading();
  const { undo, redo } = useRefHistory(mappingRecords, { deep: true });

  function deserializeRecord(record: string): Robot.MappingRecord {
    return record.match(
      /(?<id>\d+)\,(?<time>\d+)\,(?<encMedia>\d+)\,(?<encLeft>\d+)\,(?<encRight>\d+)\,(?<status>\d+)\,(?<trackStatus>\d+)\,(?<offset>\d+)/
    ).groups as unknown as Robot.MappingRecord;
  }

  function serializeRecord(record: Robot.MappingRecord): string {
    return `${record.id},${record.time},${record.encMedia},${record.encLeft},${record.encRight},${record.status},${record.trackStatus},${record.offset}`;
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

    return Promise.resolve();
  }

  const { routineWithErrorCapturing: deleteRecords } = useErrorCapturing(
    notifyLoading(clearRecords.bind(undefined, true)),
    [RuntimeError],
    error
  );

  const { routineWithErrorCapturing: hardDeleteRecords } = useErrorCapturing(
    notifyLoading(clearRecords.bind(undefined, false)),
    [RuntimeError],
    error
  );

  function removeRecord(
    id: Robot.MappingRecord['id']
  ): Robot.MappingRecord | null {
    const index = mappingRecords.value.findIndex((record) => id == record.id);
    if (index === -1) return null;

    return mappingRecords.value.splice(index, 1).shift();
  }

  function addRecord(
    time: Robot.MappingRecord['time'],
    status: Robot.MappingRecord['status'],
    encMedia: Robot.MappingRecord['encMedia'],
    encLeft: Robot.MappingRecord['encLeft'],
    encRight: Robot.MappingRecord['encRight'],
    trackStatus: Robot.MappingRecord['trackStatus'],
    offset: Robot.MappingRecord['offset'],
    id?: Robot.MappingRecord['id']
  ) {
    mappingRecords.value.push({
      id: id || mappingRecords.value.length,
      status,
      encLeft,
      encMedia,
      encRight,
      trackStatus,
      offset,
      time,
    });
  }

  const { autoRetriedRoutine: autoRetriedSendMapping } = useRetry(
    notifyLoading(async function (
      sortedRecords?: Robot.MappingRecord[]
    ): Promise<void> {
      await deleteRecords();

      sortedRecords =
        sortedRecords ||
        [...mappingRecords.value].sort((r1, r2) => r1.encMedia - r2.encMedia);

      let mappingPayload = '';
      let sendingStatus: string;
      while (sortedRecords.length > 0) {
        while (true) {
          if (
            !sortedRecords.at(0) ||
            (mappingPayload + serializeRecord(sortedRecords.at(0)) + ';')
              .length > 90
          ) {
            break;
          }

          mappingPayload += serializeRecord(sortedRecords.shift()) + ';';
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
    }),
    [RuntimeError],
    1000
  );
  const { routineWithErrorCapturing: sendMapping } = useErrorCapturing(
    autoRetriedSendMapping,
    [RuntimeError],
    error
  );

  const { routineWithErrorCapturing: saveMapping } = useErrorCapturing(
    notifyLoading(async function (): Promise<void> {
      const savingStatus = await ble.request(
        txCharacteristicId,
        rxCharacteristicId,
        'map_SaveRuntime'
      );
      if (savingStatus !== 'OK') {
        throw new RuntimeError({
          message:
            'Ocorreu um erro durante o salvamento do mapeamento na flash.',
          action:
            'Verifique se há problemas na escrita de mapeamento na memória flash do robô.',
        });
      }
    }),
    [RuntimeError],
    error
  );

  const { routineWithErrorCapturing: fetchMapping } = useErrorCapturing(
    notifyLoading<undefined, [boolean], void>(async function (
      fromRam: boolean
    ): Promise<void> {
      const rawMapping = await ble.request<string>(
        txCharacteristicId,
        rxCharacteristicId,
        fromRam ? 'map_getRuntime' : 'map_get'
      );
      console.log(rawMapping);

      mappingRecords.value = rawMapping
        .slice(0, -1) // Ignora '\n' no final
        .split('\n')
        .map(deserializeRecord);
    }),
    [BleError],
    error
  );

  return {
    mappingRecords,
    loading,
    error,
    undo,
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
