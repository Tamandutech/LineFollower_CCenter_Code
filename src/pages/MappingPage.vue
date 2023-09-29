<template>
  <div class="q-pa-md">
    <q-table
      title="Mapeamento"
      :rows="mappingRecords"
      :columns="columns"
      row-key="id"
      binary-state-sort
    >
      <template v-slot:top-left>
        <q-btn
          :icon="mdiSourceBranch"
          flat
          @click="toogleVersionsDialog(true)"
          :disable="!ble.connected"
        />
      </template>
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
            
            <q-select filled v-model="scope.value" :options="trackStatusOptions" emit-value map-options/>

            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn
        @click="
          withSuccessFeedback(sendMapping, {
            summary: 'Mapeamento Enviado',
            message: 'O mapeamento foi enviado para o robô com sucesso!',
          })()
        "
        color="primary"
        label="Enviar mapeamento"
        :disable="loading !== null || mappingRecords.length === 0"
      />
      <q-btn
        @click="fetchMapping(false)"
        color="primary"
        label="Ler mapeamento"
      />
      <q-btn
        @click="fetchMapping(true)"
        color="primary"
        label="Ler mapeamento na Ram"
      />
      <q-btn
        @click="
          performAction(
            withSuccessFeedback(saveMapping, {
              summary: 'Mapeamento Salvo',
              message: 'O mapeamento enviado foi registrado com sucesso!',
            }),
            [],
            {
              title: 'Salvar Mapeamento',
              question: 'Tem certeza que deseja salvar o mapeamento atual?',
            }
          )
        "
        color="primary"
        label="Salvar mapeamento"
        :disable="loading !== null"
      />
      <q-dialog v-model="showErrorDialog">
        <CommandErrorCard :error="error" />
      </q-dialog>
      <SuccessDialog
        v-model="showSuccessDialog"
        v-if="showSuccessDialog"
        :title="successDialogState.summary"
        :message="successDialogState.message"
      />
      <ConfirmActionDialog
        :confirm="confirm"
        v-if="isRevealed"
        :cancel="cancel"
        v-model="isRevealed"
      >
        <template #title>{{ confirmDialogState.title }}</template>
        <template #question>{{ confirmDialogState.question }}</template>
      </ConfirmActionDialog>

      <ProfileVersionsDialog
        collection="mappings"
        title="Mapeamentos"
        :data="mappingRecords"
        @install-request="
        (version: Robot.ProfileVersion<Robot.Mapping>) =>
          performAction(
            withSuccessFeedback(
              sendMapping,
              {summary: 'Versão instalada com sucesso!', message: 'O mapeamento foi enviado para robô. Salve para que ele seja utilizado na pista.'}
            ),
            [version.data],
            {
              title: 'Instalar Versão',
              question: 'Tem certeza que deseja instalar a versão selecionada do mapeamento?'
            }
          )
      "
        installable
        v-model="showVersionsDialog"
        v-slot="{ version }"
        v-if="showVersionsDialog"
      >
        <q-list separator>
          <q-expansion-item
            switch-toggle-side
            v-for="(record, index) of version.data"
            :key="index"
            :caption="Number(index) || '0'"
          >
            <q-list separator>
              <q-item v-for="(value, key) in record" :key="key">
                <q-item-section>{{ key }}</q-item-section>
                <q-item-section side>{{ value }}</q-item-section>
              </q-item>
            </q-list>
          </q-expansion-item>
        </q-list>
      </ProfileVersionsDialog>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn
        @click="
          performAction(
            async (id: number) => removeRecord(id),
            [deleteRecordId],
            {
              title: 'Deletar Registro',
              question: `Tem certeza que deseja deletar o registro ${deleteRecordId}`,
            }
          )
        "
        color="primary"
        label="Deletar Registro"
      />
      <q-btn
        @click="
          performAction(
            withSuccessFeedback(hardDeleteRecords, {
              summary: 'Mapeamento Deletado',
              message: 'O mapeamento salvo na flash foi deletado com sucesso.',
            }),
            [],
            {
              title: 'Deletar Mapeamento',
              question: 'Tem certeza que deseja deletar o mapeamento atual?',
            }
          )
        "
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
import { useIsTruthy } from 'src/composables/boolean';
import CommandErrorCard from 'components/cards/CommandErrorCard.vue';
import ConfirmActionDialog from 'src/components/dialogs/ConfirmActionDialog.vue';
import SuccessDialog from 'src/components/dialogs/SuccessDialog.vue';
import ProfileVersionsDialog from 'src/components/dialogs/ProfileVersionsDialog.vue';
import {
  usePerformActionDialog,
  useSuccessFeedback,
} from 'src/composables/actions';
import { ref, computed, watchEffect } from 'vue';
import { useToggle } from '@vueuse/core';
import { mdiSourceBranch } from '@quasar/extras/mdi-v6';
import { trackStatusOptions } from 'src/utils/trackStatusOptions';

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

const {
  isRevealed,
  confirm,
  cancel,
  performAction,
  state: confirmDialogState,
} = usePerformActionDialog();

const { feedback: successDialogState, withSuccessFeedback } =
  useSuccessFeedback();
const showSuccessDialog = useIsTruthy(successDialogState);

const [showVersionsDialog, toogleVersionsDialog] = useToggle(false);

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

function addMappingRecord() {
  const record = newRecord.value[0];
  return addRecord(
    record.time,
    record.status,
    record.encMedia,
    record.encLeft,
    record.encRight,
    record.trackStatus,
    record.offset
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


const sectionOftheTrackToText = (trackStatus: number) => {
  const option = trackStatusOptions.find((option) => option.value == trackStatus);
  return option ? option.label : 'Desconhecido';
}


</script>
