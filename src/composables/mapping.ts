import { useLoading } from './loading';
import { useRetry } from './retry';
import { useErrorCapturing } from './error';
import { RuntimeError, BleError } from 'src/services/ble/errors';
import { getTimer } from 'src/services/ble/utils';
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
      /(?<id>\d+)\,(?<time>\d+)\,(?<encMedia>\d+)\,(?<trackStatus>\d+)\,(?<offset>\d+)/
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

    return Promise.resolve();
  }

  const { deleteRecords } = useErrorCapturing(
    notifyLoading(
      clearRecords.bind(undefined, true),
      'deleteRecords',
      getTimer(5)
    ),
    [RuntimeError],
    error
  );

  const { hardDeleteRecords } = useErrorCapturing(
    notifyLoading(
      clearRecords.bind(undefined, false),
      'hardDeleteRecords',
      getTimer(5)
    ),
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
    encMedia: Robot.MappingRecord['encMedia'],
    trackStatus: Robot.MappingRecord['trackStatus'],
    offset: Robot.MappingRecord['offset'],
    id?: Robot.MappingRecord['id']
  ) {
    mappingRecords.value.push({
      id: id || mappingRecords.value.length,
      encMedia,
      trackStatus,
      offset,
      time,
    });
  }

  const { sendMapping } = useErrorCapturing(
    useRetry(
      notifyLoading(
        async function (records?: Robot.MappingRecord[]): Promise<void> {
          await deleteRecords();

          records = [
            ...(records || mappingRecords.value).sort(
              (r1, r2) => r1.encMedia - r2.encMedia
            ),
          ];

          let sendingStatus: string;
          let mappingPayload: string;
          while (records.length > 0) {
            mappingPayload = '';
            while (true) {
              if (
                !records.at(0) ||
                (mappingPayload + serializeRecord(records.at(0)) + ';').length >
                  90
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
        },
        'sendMapping',
        getTimer(10)
      ),
      [RuntimeError],
      1000
    )['sendMapping'] as (records?: Robot.MappingRecord[]) => Promise<void>,
    [RuntimeError],
    error
  );

  const { saveMapping } = useErrorCapturing(
    notifyLoading(
      async function (): Promise<void> {
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
      },
      'saveMapping',
      getTimer(5)
    ),
    [RuntimeError],
    error
  );

  const { fetchMapping } = useErrorCapturing(
    notifyLoading<undefined, [boolean], void>(
      async function (fromRam: boolean): Promise<void> {
        const rawMapping = await ble.request<string>(
          txCharacteristicId,
          rxCharacteristicId,
          fromRam ? 'map_getRuntime' : 'map_get'
        );

        mappingRecords.value =
          rawMapping === ''
            ? []
            : rawMapping
                .slice(0, -1) // Ignora '\n' no final
                .split('\n')
                .map(deserializeRecord);
      },
      'fetchMapping',
      getTimer(5)
    ),
    [BleError],
    error
  );

  return {
    mappingRecords,
    loading,
    error,
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
