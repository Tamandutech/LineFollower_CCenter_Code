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
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="SendMap" color="primary" label="Enviar mapeamento" :disable="MapStore.MapSending || MapStore.Mapregs.length === 0" />
      <q-btn @click="RobotHandler.queueCommand(new map_get())" color="primary" label="Ler mapeamento" />
      <q-btn @click="RobotHandler.queueCommand(new map_get(true))" color="primary" label="Ler mapeamento na Ram" />
      <q-btn @click="SaveMap" color="primary" label="Salvar mapeamento" :disable="MapStore.MapSaving" />
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
        </q-tr>
      </template>
    </q-table>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="AddMapReg" color="primary" label="Adicionar Registro" />
    </div>
  </div>
</template>

<script lang="ts">
import { RegMap, useMappingStore } from 'src/stores/MappingData';
import { map_add, map_clear, map_get, map_SaveRuntime } from './../utils/robot/commands/cmd_param';
import { ref } from 'vue';
import { RobotHandler } from 'src/utils/robot/handler';

const columns = [
  {
    name: 'id',
    required: true,
    label: 'ID',
    align: 'left',
    field: (row) => row.name,
    format: (val) => `${val}`,
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
];

const Newcolumns = [
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
];

const NewReg = [
  {
    id: 1,
    EncMedia: 100,
    Time: 45,
    EncRight: 566,
    EncLeft: 123,
    Status: 345,
  },
];

const MapStore = useMappingStore();
const MapRows = MapStore.Mapregs;

export default {
  setup() {
    let DeleteRegID = ref(0);

    return {
      columns,
      Newcolumns,
      MapRows: ref(MapRows),
      NewReg: ref(NewReg),
      DeleteRegID,
      DeleteMapReg,
      DeleteAllMapRegs,
      MapStore,
      RobotHandler,
      map_add,
      map_clear,
      map_get,
      map_SaveRuntime,
    };

    function DeleteMapReg() {
      MapStore.deleteReg(DeleteRegID.value);
      while (MapStore.options.length !== 0) MapStore.options.pop();
      for (var i = 0; i < MapStore.TotalRegs; i++) MapStore.options.push(MapStore.Mapregs.at(i).id);
      if (MapStore.TotalRegs > 0) DeleteRegID.value = MapStore.Mapregs.at(0).id;
      else DeleteRegID.value = 1;
    }

    function DeleteAllMapRegs() {
      MapStore.clearMap();
      RobotHandler.queueCommands([new map_clear(true), new map_clear()]);
    }
  },

  created() {
    while (MapStore.options.length !== 0) MapStore.options.pop();
    for (var i = 0; i < MapStore.TotalRegs; i++) MapStore.options.push(MapStore.Mapregs.at(i).id);
  },

  methods: {
    SendMap() {
      let tempMap = MapStore.Mapregs;
      tempMap.sort((d1, d2) => d1.EncMedia - d2.EncMedia);
      console.log(MapStore.getRegString(0));
      MapStore.MapSending = true;
      RobotHandler.queueCommand(new map_clear());
      RobotHandler.queueCommand(new map_add(MapStore.getRegByPosition(0)));
      MapStore.setRegToSend(0);
    },

    SaveMap() {
      RobotHandler.queueCommand(new map_SaveRuntime());
      MapStore.MapSaving = true;
    },

    AddMapReg() {
      let NewMapReg = {} as RegMap;
      NewMapReg.id = 0;
      NewMapReg.Time = NewReg[0].Time;
      NewMapReg.Status = NewReg[0].Status;
      NewMapReg.EncMedia = NewReg[0].EncMedia;
      NewMapReg.EncLeft = NewReg[0].EncLeft;
      NewMapReg.EncRight = NewReg[0].EncRight;
      MapStore.addRegObj(NewMapReg);
    },
  },
};
</script>
