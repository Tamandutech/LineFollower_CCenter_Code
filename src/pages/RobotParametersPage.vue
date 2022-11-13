<template>
  <q-page>

    <q-dialog v-model="uploadModal" persistent transition-show="scale" transition-hide="scale">
      <q-card style="width: 300px">
        <q-card-section>
          <div class="text-h6">Upload Parâmetros</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class=" q-gutter-sm">
            <q-file outlined v-model="fileSelected" @update:model-value="loadJSONFile">
              <template v-slot:prepend>
                <q-icon :name="mdiPaperclip" />
              </template>
            </q-file>

            <q-tree v-if="jsonFromFile.length > 0" tick-strategy="leaf" v-model:ticked="ticked" :nodes="jsonFromFile"
              node-key="key" dense />

            <div class="text-h6">Ticked</div>
            <div>
              <div v-for="tick in ticked" :key="`ticked-${tick}`">
                {{ tick }}
              </div>
            </div>
          </div>
        </q-card-section>


        <q-card-actions align="right">
          <q-btn @click="loadJSONFileToRobot" flat label="OK" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <div class="q-pa-md">
      <q-table grid card-container-class="row wrap justify-start items-baseline" title="Classes"
        :rows="classes.dataClasses" :columns="columns" row-key="name" :filter="filter" hide-header hide-bottom>

        <template v-slot:top-left>
          <div class="q-px-md q-gutter-sm">
            <q-btn :loading="loadingParameters" :icon="mdiRefreshCircle" @click="loadParameters" color="primary">
              <template v-slot:loading>
                <q-spinner-hourglass class="on-center" />
              </template>
            </q-btn>

            <q-btn :icon="mdiTableArrowDown" @click="downloadParameters" color="primary"></q-btn>
            <q-btn :icon="mdiTableArrowUp" @click="uploadModal = true" color="primary"></q-btn>
          </div>
        </template>

        <template v-slot:top-right>
          <q-input borderless dense debounce="300" v-model="filter" placeholder="Procurar">
            <template v-slot:append>
              <q-icon :name="mdiDatabaseSearch" />
            </template>
          </q-input>
        </template>

        <template v-slot:item="props">
          <div class="q-pa-xs col-xs-12 col-sm-6 col-md-4" style="height: 100%">
            <q-card>
              <q-card-section class="text-center">
                <strong>{{ props.row.name }}</strong>
              </q-card-section>
              <q-separator />
              <q-card-section>
                <q-table :rows="props.row.parameters" hide-header flat>
                  <template v-slot:body="props">
                    <q-tr :props="props">
                      <q-td key="name" :props="props">
                        <strong>{{ props.row.name }}</strong>
                      </q-td>

                      <q-td key="value" :props="props">
                        {{ props.row.value }}
                        <q-popup-edit :model-value="props.row.value" @save="
                          (val, initialValue) =>
                            robotQueue.addCommands([
                              param_set.fromRobotParameter(props.row, val, initialValue),
                              new param_get(
                                props.row.class.name,
                                props.row.name
                              ),
                            ])
                        " :title="props.row.name" buttons v-slot="scope">
                          <q-input type="number" v-model="scope.value" dense autofocus />
                        </q-popup-edit>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </div>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script lang="ts">
import { useRobotParameters } from 'stores/robotParameters';
import {
  param_set,
  param_get,
  param_list,
} from 'src/utils/robot/commands/cmdParam';
import { useRobotQueue } from 'stores/robotQueue';
import { ref, Ref, computed, defineComponent } from 'vue';
import { useQuasar, exportFile, date } from 'quasar';
import { mdiDatabaseSearch, mdiRefreshCircle, mdiTableArrowDown, mdiTableArrowUp, mdiPaperclip } from '@quasar/extras/mdi-v6';

export default defineComponent({
  name: 'IndexPage',

  setup() {
    const loadingParameters = ref(false);
    const robotQueue = useRobotQueue();
    const classes = useRobotParameters();

    const uploadModal = ref(false);
    const fileSelected: Ref<File | null> = ref(null);

    const jsonFromFile= ref([]);
    const ticked= ref([]);

    function loadJSONFile(file: File | null) {
      console.log(file);

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target) {
            let dataClasses: LFCommandCenter.DataClass[] = JSON.parse(e.target.result as string);

            let json = [];

            dataClasses.forEach((dataClass) => {
              json.push({
                key: dataClass.name,
                label: dataClass.name,
                children: dataClass.parameters.map((parameter) => {
                  return {
                    key: dataClass.name + '.' + parameter.name + ':' + parameter.value,
                    label: parameter.name + ': ' + parameter.value,
                  };
                }),
              });
            });

            jsonFromFile.value = json;

            console.log('jsonFromFile', jsonFromFile.value);
          }
        };
        reader.readAsText(file);
      }
    };

    function loadJSONFileToRobot(){
      console.log('Selecionados: ', ticked);

      ticked.value.forEach((tick) => {

        const className = tick.split(/[.:]+/)[0];
        const parameterName = tick.split(/[.:]+/)[1];
        const parameterValue = tick.split(/[.:]+/)[2];
        const parameterInitialValue = classes.dataClasses.find((dataClass) => dataClass.name === className)?.parameters.find((parameter) => parameter.name === parameterName)?.value;

        robotQueue.addCommand(
          new param_set(className, parameterName, parameterValue, parameterInitialValue),
          // new param_get(className,parameterName),
        );

        console.log('Enviado', className, parameterName, parameterValue, parameterInitialValue);
      });

      loadParameters();
    };

    function loadParameters() {
      loadingParameters.value = true;
      robotQueue.addCommand(new param_list());

      setTimeout(() => {
        loadingParameters.value = false;
      }, 10000);
    }

    function downloadParameters() {
      let parametersJSON = JSON.stringify(classes.dataClasses, (key, value) => {
        if (key === 'class') {
          return undefined;
        }
        return value;
      });

      const timeStamp = date.formatDate(Date.now(), 'HH-mm-ss-SSS_DD-MM-YYYY');

      exportFile('parameters_' + timeStamp + '.json', parametersJSON, 'application/json');
    }

    classes.$onAction(() => {
      loadingParameters.value = false;
    }, true);

    const $q = useQuasar();

    const filter = ref('');

    return {
      uploadModal,
      fileSelected,

      mdiDatabaseSearch,
      mdiRefreshCircle,
      mdiTableArrowDown,
      mdiTableArrowUp,
      mdiPaperclip,

      classes,
      robotQueue,

      filter,
      loadingParameters,
      loadParameters,
      downloadParameters,
      loadJSONFile,
      loadJSONFileToRobot,
      jsonFromFile,
      ticked,

      param_set,
      param_get,

      columns: [
        { name: 'name', label: 'Name', field: 'name' },
        { name: 'calories', label: 'Calories (g)', field: 'calories' },
      ],

      cardContainerClass: computed(() => {
        return $q.screen.gt.xs
          ? 'grid-masonry grid-masonry--' + ($q.screen.gt.sm ? '3' : '2')
          : null;
      }),

      rowsPerPageOptions: computed(() => {
        return $q.screen.gt.xs ? ($q.screen.gt.sm ? [3, 6, 9] : [3, 6]) : [3];
      }),
    };
  },
});
</script>
