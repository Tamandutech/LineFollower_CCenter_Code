<template>
  <div class="q-pa-md">
    <q-table title="Mapeamento" :rows="MapRows" :columns="columns" row-key="id" binary-state-sort>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="id" :props="props">
            {{ props.row.id }}
          </q-td>
          <q-td key="EncMedia" :props="props">
            {{ props.row.EncMedia }}
            <q-popup-edit v-model="props.row.EncMedia" title="Atualizar Média dos encoders" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.Time }}
            <q-popup-edit v-model="props.row.Time" title="Atualizar o tempo" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.EncRight }}
            <q-popup-edit v-model="props.row.EncRight" title="Atualizar Encoder direito" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.EncLeft }}
            <q-popup-edit v-model="props.row.EncLeft" title="Atualizar Encoder esquerdo" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.Status }}
            <q-popup-edit v-model="props.row.Status" title="Atualizar o status" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="TrackStatus" :props="props">
            {{ props.row.TrackStatus }}
            <q-popup-edit v-model="props.row.TrackStatus" title="Atualizar o Trackstatus" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="SendMap" color="primary" label="Enviar mapeamento" :disable="MapStore.mapSending || MapStore.Mapregs.length === 0" />
      <q-btn @click="RobotHandler.queueCommand(new map_get())" color="primary" label="Ler mapeamento" />
      <q-btn @click="RobotHandler.queueCommand(new map_get(true))" color="primary" label="Ler mapeamento na Ram" />
      <q-btn @click="SaveMap" color="primary" label="Salvar mapeamento" :disable="MapStore.mapSaving" />
      <q-dialog v-model="MapStore.MapSent">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Mapeamento</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ MapStore.MapStringDialog }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="DeleteMapReg" color="primary" label="Deletar Registro" />
      <q-btn @click="DeleteAllMapRegs" color="primary" label="Deletar todos os registros" />
      <q-select v-model="DeleteRegID" :options="MapStore.options" label="Selecione o ID do registro que será deletado" />
    </div>
    <q-table title="Adicionar Registro" :rows="NewReg" :columns="Newcolumns" row-key="id" binary-state-sort>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="EncMedia" :props="props">
            {{ props.row.EncMedia }}
            <q-popup-edit v-model="props.row.EncMedia" title="Atualizar Média dos encoders" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.Time }}
            <q-popup-edit v-model="props.row.Time" title="Atualizar o tempo" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.EncRight }}
            <q-popup-edit v-model="props.row.EncRight" title="Atualizar Encoder direito" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.EncLeft }}
            <q-popup-edit v-model="props.row.EncLeft" title="Atualizar Encoder esquerdo" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.Status }}
            <q-popup-edit v-model="props.row.Status" title="Atualizar o status" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="TrackStatus" :props="props">
            {{ props.row.TrackStatus }}
            <q-popup-edit v-model="props.row.TrackStatus" title="Atualizar o Trackstatus" buttons v-slot="scope">
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="AddMapReg" color="primary" label="Adicionar Registro" />
    </div>
  </div>
</template>

<script lang="ts">
import { useMapping } from 'stores/mapping';
import { map_add, map_clear, map_get, map_SaveRuntime } from 'src/utils/robot/commands/cmdParam';
import { ref } from 'vue';
import { RobotHandler } from 'src/utils/robot/handler';
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
  { name: 'Status', label: 'Status', field: 'Status' },
  { name: 'TrackStatus', label: 'TrackStatus', field: 'TrackStatus' },
];
const NewReg = [
  {
    id: 1,
    EncMedia: 100,
    Time: 45,
    EncRight: 566,
    EncLeft: 123,
    Status: 345,
    TrackStatus: 1,
  },
];
const mapping = useMapping();
const mapRows = mapping.mapRegs;
export default {
  setup() {
    let DeleteRegID = ref(0);
    return {
      columns,
      Newcolumns: newColumns,
      MapRows: ref(mapRows),
      NewReg: ref(NewReg),
      DeleteRegID,
      DeleteMapReg,
      DeleteAllMapRegs,
      MapStore: mapping,
      RobotHandler,
      map_add,
      map_clear,
      map_get,
      map_SaveRuntime,
    };
    function DeleteMapReg() {
      mapping.deleteReg(DeleteRegID.value);
      while (mapping.options.length !== 0) mapping.options.pop();
      for (var i = 0; i < mapping.TotalRegs; i++) mapping.options.push(mapping.mapRegs.at(i).id);
      if (mapping.TotalRegs > 0) DeleteRegID.value = mapping.mapRegs.at(0).id;
      else DeleteRegID.value = 1;
    }
    function DeleteAllMapRegs() {
      mapping.clearMap();
      RobotHandler.queueCommands([new map_clear(false)]);
    }
  },
  created() {
    while (mapping.options.length !== 0) mapping.options.pop();
    for (var i = 0; i < mapping.TotalRegs; i++) mapping.options.push(mapping.mapRegs.at(i).id);
  },
  methods: {
    SendMap() {
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
      RobotHandler.queueCommand(new map_clear());
      RobotHandler.queueCommand(new map_add(tempMap));
    },
    SaveMap() {
      RobotHandler.queueCommand(new map_SaveRuntime());
      mapping.mapSaving = true;
    },
    AddMapReg() {
      let newMapReg = {} as LFCommandCenter.RegMap;
      newMapReg.id = 0;
      newMapReg.time = NewReg[0].Time;
      newMapReg.status = NewReg[0].Status;
      newMapReg.encMedia = NewReg[0].EncMedia;
      newMapReg.encLeft = NewReg[0].EncLeft;
      newMapReg.encRight = NewReg[0].EncRight;
      newMapReg.trackStatus = NewReg[0].TrackStatus;
      mapping.addRegObj(newMapReg);
    },
  },
};
</script>
