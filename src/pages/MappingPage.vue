<template>
  <div class="q-pa-md">
    <q-table
      title="Mapeamento"
      :rows="rows"
      :columns="columns"
      row-key="id"
      binary-state-sort
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="id" :props="props">
            {{ props.row.id }}
          </q-td>
          <q-td key="EncMedia" :props="props">
            {{ props.row.encMedia }}
            <q-popup-edit
              v-model="props.row.encMedia"
              title="Atualizar Média dos encoders"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.time }}
            <q-popup-edit
              v-model="props.row.time"
              title="Atualizar o tempo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.encRight }}
            <q-popup-edit
              v-model="props.row.encRight"
              title="Atualizar Encoder direito"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.encLeft }}
            <q-popup-edit
              v-model="props.row.encLeft"
              title="Atualizar Encoder esquerdo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Offset" :props="props">
            {{ props.row.offset }}
            <q-popup-edit
              v-model="props.row.offset"
              title="Atualizar Offset"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.status }}
            <q-popup-edit
              v-model="props.row.status"
              title="Atualizar o status"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="TrackStatus" :props="props">
            {{ props.row.trackStatus }}
            <q-popup-edit
              v-model="props.row.trackStatus"
              title="Atualizar o Trackstatus"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn
        @click="performAction(sendMapping, 'Mapeamento enviado.')"
        color="primary"
        label="Enviar mapeamento"
        :disable="loading || mappingRecords.length === 0"
      />
      <q-btn
        @click="fetchMapping(true)"
        color="primary"
        label="Ler mapeamento"
      />
      <q-btn
        @click="fetchMapping(false)"
        color="primary"
        label="Ler mapeamento na Ram"
      />
      <q-btn
        @click="performAction(saveMapping, 'Mapeamento salvo com sucesso.')"
        color="primary"
        label="Salvar mapeamento"
        :disable="loading"
      />
      <q-dialog v-model="showErrorDialog">
        <CommandErrorCard :error="error" />
      </q-dialog>
      <q-dialog v-model="showSuccessDialog">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Mapeamento</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ successDialogMessage }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="isRevealed">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Deletar Registro</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            Tem certeza que deseja deletar o registro {{ deleteRecordId }}?
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="SIM" v-close-popup @click="confirm" />
            <q-btn flat label="NÃO" v-close-popup @click="cancel" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="reveal" color="primary" label="Deletar Registro" />
      <q-btn
        @click="hardDeleteRecords"
        color="primary"
        label="Deletar todos os registros"
      />
      <q-select
        v-model="deleteRecordId"
        :options="recordDeleteOptions"
        :disable="recordDeleteOptions.length == 0"
        label="Selecione o ID do registro que será deletado"
      />
    </div>
    <q-table
      title="Adicionar Registro"
      :rows="newRecord"
      :columns="newColumns"
      row-key="id"
      binary-state-sort
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="EncMedia" :props="props">
            {{ props.row.encMedia }}
            <q-popup-edit
              v-model="props.row.encMedia"
              title="Atualizar Média dos encoders"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.time }}
            <q-popup-edit
              v-model="props.row.time"
              title="Atualizar o tempo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.encRight }}
            <q-popup-edit
              v-model="props.row.encRight"
              title="Atualizar Encoder direito"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.encLeft }}
            <q-popup-edit
              v-model="props.row.encLeft"
              title="Atualizar Encoder esquerdo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Offset" :props="props">
            {{ props.row.offset }}
            <q-popup-edit
              v-model="props.row.offset"
              title="Atualizar Offset"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.status }}
            <q-popup-edit
              v-model="props.row.status"
              title="Atualizar o status"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="TrackStatus" :props="props">
            {{ props.row.trackStatus }}
            <q-popup-edit
              v-model="props.row.trackStatus"
              title="Atualizar o Trackstatus"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn
        @click="addMappingRecord"
        color="primary"
        label="Adicionar Registro"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import useBluetooth from 'src/services/ble';
import { useRobotMapping } from 'src/composables/mapping';
import CommandErrorCard from 'components/cards/CommandErrorCard.vue';
import { useConfirmDialog } from '@vueuse/core';
import { ref, computed, watchEffect } from 'vue';
import { useIsTruthy } from 'src/composables/boolean';

const { ble } = useBluetooth();
const {
  mappingRecords,
  loading,
  error,
  hardDeleteRecords,
  removeRecord,
  addRecord,
  sendMapping,
  saveMapping,
  fetchMapping,
} = useRobotMapping(ble, 'UART_TX', 'UART_RX');
const showErrorDialog = useIsTruthy(error);

const showSuccessDialog = ref(false);
const successDialogMessage = ref<string>();
async function performAction(action: () => void, successMessage: string) {
  try {
    await action();
    showSuccessDialog.value = true;
    successDialogMessage.value = successMessage;
  } catch (e) {
    error.value = e;
    showErrorDialog.value = true;
  }
}

const deleteRecordId = ref(0);
const recordDeleteOptions = computed(() =>
  mappingRecords.value.map((record) => record.id)
);
watchEffect(() => {
  if (mappingRecords.value.length > 0) {
    deleteRecordId.value = mappingRecords.value.at(0).id;
  } else {
    deleteRecordId.value = null;
  }
});
const { isRevealed, reveal, confirm, cancel, onConfirm } = useConfirmDialog();
onConfirm(() => removeRecord(deleteRecordId.value));

function addMappingRecord() {
  const record = newRecord.value[0];
  return addRecord(
    record.time,
    record.status,
    record.encMedia,
    record.encLeft,
    record.encRight,
    record.offset,
    record.trackStatus
  );
}

const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: (row: { name: string; label: string }) => row.name,
    format: (val: number) => val.toString(),
    sortable: true,
  },
  {
    name: 'EncMedia',
    align: 'center',
    label: 'Média dos encoders (pulsos)',
    field: 'EncMedia',
    sortable: true,
  },
  { name: 'Time', label: 'Tempo (ms)', field: 'Time' },
  { name: 'EncRight', label: 'Encoder direito (pulsos)', field: 'EncRight' },
  { name: 'EncLeft', label: 'Encoder esquerdo (pulsos)', field: 'EncLeft' },
  { name: 'Offset', label: 'Offset(pulsos)', field: 'Offset' },
  { name: 'Status', label: 'Status', field: 'Status' },
  { name: 'TrackStatus', label: 'TrackStatus', field: 'TrackStatus' },
];
const rows = computed(() =>
  mappingRecords.value.map((record) => ({ ...record }))
);

const newColumns = [
  {
    name: 'EncMedia',
    align: 'center',
    label: 'Média dos encoders (pulsos)',
    field: 'EncMedia',
  },
  { name: 'Time', label: 'Tempo (ms)', field: 'Time' },
  { name: 'EncRight', label: 'Encoder direito (pulsos)', field: 'EncRight' },
  { name: 'EncLeft', label: 'Encoder esquerdo (pulsos)', field: 'EncLeft' },
  { name: 'Offset', label: 'Offset(pulsos)', field: 'Offset' },
  { name: 'Status', label: 'Status', field: 'Status' },
  { name: 'TrackStatus', label: 'TrackStatus', field: 'TrackStatus' },
];
const newRecord = ref<Robot.MappingRecord[]>([
  {
    id: 1,
    encMedia: 100,
    time: 45,
    encRight: 566,
    encLeft: 123,
    status: 0,
    offset: 5,
    trackStatus: 2,
  },
]);
</script>
