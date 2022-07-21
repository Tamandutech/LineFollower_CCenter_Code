<template>
  <div class="q-pa-md">
    <q-table
      title="Mapeamento"
      :rows="MapRows"
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
            {{ props.row.EncMedia }}
            <q-popup-edit
              v-model="props.row.EncMedia"
              title="Atualizar Média dos encoders"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.Time }}
            <q-popup-edit
              v-model="props.row.Time"
              title="Atualizar o tempo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.EncRight }}
            <q-popup-edit
              v-model="props.row.EncRight"
              title="Atualizar Encoder direito"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.EncLeft }}
            <q-popup-edit
              v-model="props.row.EncLeft"
              title="Atualizar Encoder esquerdo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.Status }}
            <q-popup-edit
              v-model="props.row.Status"
              title="Atualizar o status"
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
        @click="SendMap"
        color="primary"
        label="Enviar mapeamento"
        :disable="MapSending"
      />
      <q-btn @click="ReceiveMap" color="primary" label="Ler mapeamento" />
      <q-btn
        @click="ReceiveMapRam"
        color="primary"
        label="Ler mapeamento na Ram"
      />
      <q-btn
        @click="SaveMap"
        color="primary"
        label="Salvar mapeamento"
        :disable="MapSaving"
      />
      <q-dialog v-model="MapSendDialog">
        <q-card style="width: 300px">
          <q-card-section>
            <div class="text-h6">Mapeamento</div>
          </q-card-section>

          <q-card-section class="q-pt-none">
            {{ MapStringDialog }}
          </q-card-section>

          <q-card-actions align="right" class="bg-white text-teal">
            <q-btn flat label="OK" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
    <div class="q-pa-md q-gutter-sm">
      <q-btn @click="DeleteMapReg" color="primary" label="Deletar Registro" />
      <q-btn
        @click="DeleteAllMapRegs"
        color="primary"
        label="Deletar todos os registros"
      />
      <q-select
        v-model="DeleteRegID"
        :options="options"
        label="Selecione o ID do registro que será deletado"
      />
    </div>
    <q-table
      title="Adicionar Registro"
      :rows="NewReg"
      :columns="Newcolumns"
      row-key="id"
      binary-state-sort
    >
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td key="EncMedia" :props="props">
            {{ props.row.EncMedia }}
            <q-popup-edit
              v-model="props.row.EncMedia"
              title="Atualizar Média dos encoders"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Time" :props="props">
            {{ props.row.Time }}
            <q-popup-edit
              v-model="props.row.Time"
              title="Atualizar o tempo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncRight" :props="props">
            {{ props.row.EncRight }}
            <q-popup-edit
              v-model="props.row.EncRight"
              title="Atualizar Encoder direito"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="EncLeft" :props="props">
            {{ props.row.EncLeft }}
            <q-popup-edit
              v-model="props.row.EncLeft"
              title="Atualizar Encoder esquerdo"
              buttons
              v-slot="scope"
            >
              <q-input type="number" v-model="scope.value" dense autofocus />
            </q-popup-edit>
          </q-td>
          <q-td key="Status" :props="props">
            {{ props.row.Status }}
            <q-popup-edit
              v-model="props.row.Status"
              title="Atualizar o status"
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
      <q-btn @click="AddMapReg" color="primary" label="Adicionar Registro" />
    </div>
  </div>
</template>

<script lang="ts">
import { RegMap, mappingStore } from 'src/stores/MappingData';
import { ref, onMounted } from 'vue';
import ws from './../ws';
import { useQuasar } from 'quasar';

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

const MapStore = mappingStore();
const MapRows = MapStore.Mapregs;
let ReSendTries = 3;
let options = ref([1]);
let MapSending = ref(false);
let MapSaving = ref(false);
let MapSendDialog = ref(false);
let MapStringDialog = ref('');
export default {

  setup() {
    let DeleteRegID = ref(0);

    return {
      columns,
      Newcolumns,
      MapRows: ref(MapRows),
      NewReg: ref(NewReg),
      options,
      DeleteRegID,
      MapSending,
      MapSaving,
      MapSendDialog,
      MapStringDialog,
      DeleteMapReg,
      DeleteAllMapRegs,
    };

    function DeleteMapReg() {
      MapStore.deleteReg(DeleteRegID.value);
      while (options.value.length !== 0) options.value.pop();
      for (var i = 0; i < MapStore.TotalRegs; i++)
        options.value.push(MapStore.Mapregs.at(i).id);
      if (MapStore.TotalRegs > 0) DeleteRegID.value = MapStore.Mapregs.at(0).id;
      else DeleteRegID.value = 0;
    }

    function DeleteAllMapRegs() {
      MapStore.clearMap();
      ws.send('rmt map_clear -w');
      ws.send('rmt map_clearFlash -w');
    }

  },

  created() {
    while (options.value.length !== 0) options.value.pop();
    for (var i = 0; i < MapStore.TotalRegs; i++)
      options.value.push(MapStore.Mapregs.at(i).id);
    ws.onopen = () => {
      console.log('Conectado, buscando parâmetros...');
      ws.send('rmt param_list -w');
    };

    ws.onmessage = (event) => {

      const received = JSON.parse(event.data) as {
        cmdExecd: string;
        data: string;
      };

      console.log('Recebido:', received);
      console.log('Mensagem Recebida');

      if (received.cmdExecd.includes('map_SaveRuntime')) {
        MapSaving.value = false;
        if (received.data === 'OK') {
          MapStringDialog.value = 'Mapeamento salvo na flash com sucesso.';
          MapSendDialog.value = true;
        } else {
          MapStringDialog.value = 'Falha ao salvar mapeamento na flash.';
          MapSendDialog.value = true;
        }
      }

      if (received.cmdExecd.includes('map_add')) {
        if (received.data === 'OK') {
          if (MapStore.TotalRegs > MapStore.getRegToSend + 1) {
            ReSendTries = 3;
            let RegsString = '';
            while (MapStore.TotalRegs > MapStore.getRegToSend + 1) {
              if (
                (
                  RegsString +
                  MapStore.getRegString(MapStore.getRegToSend + 1) +
                  ';'
                ).length <= 90
              ) {
                RegsString +=
                  MapStore.getRegString(MapStore.getRegToSend + 1) + ';';
                MapStore.setRegToSend(MapStore.getRegToSend + 1);
              } else break;
            }
            ws.send('rmt "map_add ' + RegsString + '" -w');
          } else {
            console.log('Mapeamento enviado');
            MapStringDialog.value = 'Mapeamento enviado com sucesso.';
            MapSending.value = false;
            MapSendDialog.value = true;
          }
        } else if (ReSendTries > 0) {
          ReSendTries = ReSendTries - 1;
          ws.send(
            'rmt "map_add ' +
              MapStore.getRegString(MapStore.getRegToSend) +
              '" -w'
          );
        } else {
          MapStringDialog.value = 'Falha ao enviar o mapeamento.';
          MapSendDialog.value = true;
          MapSending.value = false;
        }
      }
      
      if (received.cmdExecd.includes('map_get')) {
        console.log('Mapeamento recebido');
        MapStore.clearMap();
        let Regs: string[] = received.data.split('\n');
        Regs.pop();
        console.log(Regs);
        Regs.forEach((reg) => MapStore.addReg(reg));
        while (options.value.length !== 0) options.value.pop();
        for (var i = 0; i < MapStore.TotalRegs; i++)
          options.value.push(MapStore.Mapregs.at(i).id);
        console.log(JSON.stringify(MapRows));
      }

    };
  },

  methods: {

    SendMap() {
      let tempMap = MapStore.Mapregs;
      tempMap.sort((d1, d2) => d1.EncMedia - d2.EncMedia);
      console.log(MapStore.getRegString(0));
      MapSending.value = true;
      ws.send('rmt map_clear -w');
      ws.send('rmt "map_add ' + MapStore.getRegString(0) + '" -w');
      MapStore.setRegToSend(0);
      //ws.send('rmt "map_set ' + MapStore.getMapRegsString(;) +'" -w');
    },

    ReceiveMapRam() {
      ws.send('rmt map_getRuntime -w');
    },

    ReceiveMap() {
      ws.send('rmt map_get -w');
    },

    SaveMap() {
      ws.send('rmt map_SaveRuntime -w');
      MapSaving.value = true;
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
