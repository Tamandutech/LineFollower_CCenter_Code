<template>
  <div class="q-pa-md">
    <q-table
      title="Mapeamento"
      :rows="mapping.mapRegs"
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
        @click="sendMap"
        color="primary"
        label="Enviar mapeamento"
        :disable="mapping.mapSending || mapping.mapRegs.length === 0"
      />
      <q-btn
        @click="() => robotQueue.addCommand(new map_get())"
        color="primary"
        label="Ler mapeamento"
      />
      <q-btn
        @click="() => robotQueue.addCommand(new map_get(true))"
        color="primary"
        label="Ler mapeamento na Ram"
      />
      <q-btn
        @click="saveMap"
        color="primary"
        label="Salvar mapeamento"
        :disable="mapping.mapSaving"
      />
      <q-dialog v-model="mapping.mapSent">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Mapeamento</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ mapping.mapStringDialog }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="openDeleteRegsDialog('Tem certeza que deseja deletar o registro ' + `${deleteRegID}` + '?', false)" color="primary" label="Deletar Registro" />
      <q-btn
        @click="openDeleteRegsDialog('Tem certeza que deseja deletar todos os registros do mapeamento?', true)"
        color="primary"
        label="Deletar todos os registros"
      />
      <q-dialog v-model="deleteRegsDialog">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Mapeamento</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ deleteRegsDialogText }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn  v-if="deleteAllRegs" @click="deleteAllMapRegs" flat label="Sim" v-close-popup />
            <q-btn  v-else @click="deleteMapReg" flat label="Sim" v-close-popup />
            <q-btn flat label="Não" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-select
        v-model="deleteRegID"
        :options="mapping.options"
        label="Selecione o ID do registro que será deletado"
      />
    </div>
    <q-table
      title="Adicionar Registro"
      :rows="newReg"
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
      <q-btn @click="addMapReg" color="primary" label="Adicionar Registro" />
    </div>
  </div>
</template>

<script lang="ts">
import { useMapping } from 'stores/mapping';
import {
  map_add,
  map_clear,
  map_get,
  map_SaveRuntime,
} from 'src/utils/robot/commands/cmdParam';
import { ref } from 'vue';
import { useRobotQueue } from 'stores/robotQueue';
const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: (row: { name: string; label: string }) => row.name,
    format: (val: number) => `${val}`,
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
const newReg: LFCommandCenter.RegMap[] = ref([
  {
    id: 1,
    encMedia: 100,
    time: 45,
    encRight: 566,
    encLeft: 123,
    offset: 0,
    status: 345,
    trackStatus: 2,
  },
]).value;

const mapping = useMapping();
const robotQueue = useRobotQueue();
const deleteRegsDialog = ref(false);
const deleteRegsDialogText = ref('');
const deleteAllRegs = ref(false);
const deleteRegID = ref(1);

export default {
  setup() {
    return {
      columns,
      newColumns,
      newReg,
      deleteRegID,
      deleteRegsDialog,
      deleteRegsDialogText,
      deleteAllRegs,
      deleteMapReg,
      deleteAllMapRegs,
      openDeleteRegsDialog,
      mapping,
      robotQueue,
      map_add,
      map_clear,
      map_get,
      map_SaveRuntime,
    };
    function openDeleteRegsDialog(DialogText:string, DeleteAllRegs: boolean) {
      deleteRegsDialog.value = true;
      deleteRegsDialogText.value = DialogText;
      if(DeleteAllRegs) deleteAllRegs.value = true;
      else deleteAllRegs.value = false;

    }
    function deleteMapReg() {
      mapping.deleteReg(deleteRegID.value);
      while (mapping.options.length !== 0) mapping.options.pop();
      for (var i = 0; i < mapping.totalRegs; i++)
        mapping.options.push(mapping.mapRegs.at(i).id);
      if (mapping.totalRegs > 0) deleteRegID.value = mapping.mapRegs.at(0).id;
      else deleteRegID.value = 1;
    }
    function deleteAllMapRegs() {
      mapping.clearMap();
      robotQueue.addCommand(new map_clear(false));
    }
  },
  created() {
    while (mapping.options.length !== 0) mapping.options.pop();
    for (var i = 0; i < mapping.totalRegs; i++)
      mapping.options.push(mapping.mapRegs.at(i).id);
  },
  methods: {
    sendMap() {
      let tempMap = mapping.mapRegs;
      tempMap.sort((d1, d2) => d1.encMedia - d2.encMedia);
      console.log(mapping.getRegString(0));
      mapping.mapSending = true;
      console.log(JSON.stringify(mapping.mapRegs));
      console.log(JSON.stringify(tempMap));
      mapping.setRegToSend(0);
      mapping.resendTries = 4;
      mapping.regsSent = true;
      mapping.regsString = '';
      robotQueue.addCommands([new map_clear(), new map_add(tempMap)]);
    },
    saveMap() {
      robotQueue.addCommand(new map_SaveRuntime());
      mapping.mapSaving = true;
    },
    addMapReg() {
      let newMapReg = {} as LFCommandCenter.RegMap;
      newMapReg.id = 0;
      newMapReg.time = newReg[0].time;
      newMapReg.status = newReg[0].status;
      newMapReg.encMedia = newReg[0].encMedia;
      newMapReg.encLeft = newReg[0].encLeft;
      newMapReg.encRight = newReg[0].encRight;
      newMapReg.offset = newReg[0].offset;
      newMapReg.trackStatus = newReg[0].trackStatus;
      mapping.addRegObj(newMapReg);
      while (mapping.options.length !== 0) mapping.options.pop();
      for (var i = 0; i < mapping.totalRegs; i++)
        mapping.options.push(mapping.mapRegs.at(i).id);
      if (mapping.totalRegs > 0) deleteRegID.value = mapping.mapRegs.at(0).id;
      else deleteRegID.value = 1;
    },
  },
};
</script>
