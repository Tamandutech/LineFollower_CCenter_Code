<template>
  <q-page padding class="relative-position">
    <q-dialog v-model="showErrorDialog">
      <CommandErrorCard :error="error" />
    </q-dialog>
    <q-dialog v-model="showConfigDialog" :maximized="$q.platform.is.mobile">
      <StreamsConfigCard class="full-width">
        <q-card-section>
          <q-form
            @submit="loadStreamsPanel"
            id="stream-config-form"
            ref="configForm"
          >
            <q-list>
              <q-item class="q-px-none">
                <q-item-section
                  >Selecione os parâmetros para a transmissão</q-item-section
                >
                <q-item-section side>
                  <q-btn
                    round
                    color="teal-14"
                    size="md"
                    flat
                    :icon="mdiReload"
                    :loading="updatingParameters"
                    @click="updateRuntimeParameters"
                    ><q-tooltip :delay="500"
                      >Atualizar parâmetros</q-tooltip
                    ></q-btn
                  >
                </q-item-section>
              </q-item>
              <q-separator></q-separator>
              <q-item
                v-for="(option, index) in parameters.keys()"
                :key="index"
                class="bg-grey-1 q-my-sm q-pb-sm rounded-borders column"
              >
                <div class="col q-mb-md">
                  <label :for="`parameter-otion-${index}`" class="text-bold">{{
                    option
                  }}</label>
                </div>
                <div class="col row">
                  <div class="col">
                    <q-avatar :icon="mdiCameraDocument" size="md"></q-avatar>
                    Resolução
                  </div>
                  <q-select
                    v-model="parametersToStream.get(option).range"
                    dense
                    options-dense
                    bottom-slots
                    filled
                    color="teal-5"
                    class="col-auto q-pb-sm"
                    :options="[
                      5, 10, 15, 20, 25, 30, 35, 40, 60, 80, 100, 500, 1000,
                    ]"
                  />
                </div>
                <div class="col row">
                  <div class="col">
                    <q-avatar :icon="mdiUpdate" size="md" /> Intervalo
                  </div>
                  <q-slider
                    :id="`parameter-otion-${index}`"
                    label
                    :max="3"
                    :min="0"
                    switch-label-side
                    color="teal"
                    class="col"
                    :label-value="parametersToStream.get(option).interval + 's'"
                    :model-value="parametersToStream.get(option).interval"
                    @update:model-value="
                      (value) =>
                        (parametersToStream.get(option).interval = value)
                    "
                    @change="
                      (value) =>
                        (parametersToStream.get(option).interval = value)
                    "
                    :step="0.05"
                  ></q-slider>
                </div>
              </q-item>
            </q-list>
          </q-form>
        </q-card-section>
        <q-card-section
          v-if="showInvalidConfigMessage"
          class="bg-red-2 text-red"
        >
          Selecione pelo menos um parâmetro para ser transmitido
        </q-card-section>
        <q-card-actions align="center">
          <q-btn
            color="teal-5"
            label="Iniciar Transmissão"
            @click="submitConfigForm"
            form="stream-config-form"
          />
          <q-btn v-close-popup flat color="primary" label="Fechar" />
        </q-card-actions>
      </StreamsConfigCard>
    </q-dialog>
    <StreamChartsPanel
      v-if="renderStreamsPanel"
      :parameters="parametersToStream"
      v-slot="{ loading, streams }"
      @error="(e) => (error = e)"
      @all-stopped="closeStreamsPanel"
    >
      <q-inner-loading
        :showing="loading"
        label="Inicializando transmissão..."
        label-class="text-teal text-weight-medium q-mt-md"
      />
      <q-page-sticky
        position="bottom-right"
        class="z-top"
        v-if="!loading"
        :offset="[18, 19]"
      >
        <q-btn
          fab
          :icon="showControlsDialog ? mdiClose : mdiTools"
          @click="
            () => {
              showControlsDialog = !showControlsDialog;
              [parameterTab] = streams.keys();
            }
          "
          color="teal-5"
        />
      </q-page-sticky>
      <q-dialog v-model="showControlsDialog" seamless position="right">
        <q-card>
          <q-tabs
            v-model="parameterTab"
            mobile-arrows
            inline-label
            dense
            no-caps
          >
            <q-tab
              v-for="[parameter, { color }] of streams"
              :label="parameter"
              :name="parameter"
              :key="parameter"
              :class="`text-${color}`"
              :icon="mdiChartTimelineVariant"
            />
          </q-tabs>
          <q-separator></q-separator>
          <q-tab-panels v-model="parameterTab" animated>
            <q-tab-panel
              v-for="[parameter, { max, min, mean }] of streams"
              :name="parameter"
              :key="parameter"
            >
              <q-list dense>
                <q-item
                  v-for="[icon, label, value] in [
                    [mdiChevronDoubleUp, 'Máximo', max],
                    [mdiChevronDoubleDown, 'Mínimo', min],
                    [mdiFormatVerticalAlignCenter, 'Média', mean],
                  ]"
                  :key="label"
                >
                  <q-item-section avatar>
                    <q-icon :name="icon.toString()" />
                  </q-item-section>
                  <q-item-section>{{ label }}</q-item-section>
                  <q-item-section side>
                    <q-item-label caption>{{
                      formatter.format(Number(value))
                    }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-tab-panel>
          </q-tab-panels>
          <q-separator></q-separator>
          <q-card-actions align="left">
            <q-btn
              color="grey-9"
              label="Salvar"
              @click="
                SaveStreamCsv(
                  parameterTab,
                  streams.get(parameterTab).StreamFullDataCsv
                )
              "
              v-close-popup
            />
            <q-btn
              color="grey-9"
              label="Parar"
              @click="streams.get(parameterTab).stop"
              v-close-popup
            />
            <q-btn
              color="grey-9"
              label="Parar Todas"
              flat
              @click="closeStreamsPanel"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </StreamChartsPanel>
    <div v-else class="column justify-center items-center absolute-center">
      <q-avatar
        :icon="mdiChartLine"
        size="10em"
        color="grey-4"
        text-color="grey-6"
      ></q-avatar>
      <div class="col q-mt-md text-grey-6">
        Nenhuma transmissão ativa. Clique em <q-icon :name="mdiCog" /> para
        iniciar a leitura de uma transmissão.
      </div>
    </div>
    <q-page-sticky
      position="bottom-right"
      class="z-top"
      v-if="!renderStreamsPanel"
      :offset="[18, 18]"
    >
      <q-btn
        fab
        :icon="mdiCog"
        @click="loadConfigDialog"
        v-if="!showConfigDialog"
        color="grey-9"
      />
    </q-page-sticky>
  </q-page>
</template>

<script lang="ts" setup>
import { useQuasar, exportFile } from 'quasar';
import { useRobotRuntime } from 'src/composables/runtime';
import useBluetooth from 'src/services/ble';
import {
  mdiCog,
  mdiReload,
  mdiUpdate,
  mdiChartLine,
  mdiCameraDocument,
  mdiTools,
  mdiChartTimelineVariant,
  mdiClose,
  mdiChevronDoubleUp,
  mdiChevronDoubleDown,
  mdiFormatVerticalAlignCenter,
} from '@quasar/extras/mdi-v6';
import { ref, reactive } from 'vue';
import StreamChartsPanel from 'components/StreamChartsPanel.vue';
import CommandErrorCard from 'components/cards/CommandErrorCard.vue';
import StreamsConfigCard from 'src/components/cards/StreamsConfigCard.vue';
import { useIsTruthy } from 'src/composables/boolean';

const { ble } = useBluetooth();
const { parameters, error, updateParameters } = useRobotRuntime(
  ble,
  'UART_TX',
  'UART_RX'
);
const showErrorDialog = useIsTruthy(error);

const showConfigDialog = ref(false);
const showInvalidConfigMessage = ref(false);
const showControlsDialog = ref(false);
const configForm = ref<quasar.QForm>(null);
const updatingParameters = ref(false);
const parametersToStream = reactive<
  Map<string, { interval: number; range: number }>
>(new Map());
const renderStreamsPanel = ref(false);
const parameterTab = ref<string>();

const loadConfigDialog = async function () {
  await updateRuntimeParameters();

  if (parameters.value.size > 1 && !showErrorDialog.value) {
    showInvalidConfigMessage.value = false;
    showConfigDialog.value = true;
  }
};

const updateRuntimeParameters = async function () {
  updatingParameters.value = true;

  await updateParameters();
  parameters.value.forEach((_, parameter) =>
    parametersToStream.set(parameter, { interval: 0, range: 20 })
  );

  updatingParameters.value = false;
};

const submitConfigForm = () => {
  if ([...parametersToStream.values()].some(({ interval }) => interval > 0)) {
    configForm.value.submit(new Event('submit'));
    showConfigDialog.value = false;
  } else {
    showInvalidConfigMessage.value = true;
  }
};

const loadStreamsPanel = () => {
  setTimeout(() => (renderStreamsPanel.value = true), 10);
};
const closeStreamsPanel = () => {
  renderStreamsPanel.value = false;
  showControlsDialog.value = false;
};

const SaveStreamCsv = (StreamName: string, StreamData: string) => {
  exportFile(StreamName + '.csv', StreamData, 'text/csv;charset=UTF-8;');
};

const $q = useQuasar();
const formatter = Intl.NumberFormat($q.lang.getLocale(), {
  notation: 'scientific',
});
</script>
