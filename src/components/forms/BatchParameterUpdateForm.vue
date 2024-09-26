<template>
  <q-form
    class="q-gutter-md"
    @submit="
      () =>
        performAction(
          withSuccessFeedback(
            async (parameters) => {
              await installParameters(parameters);
              emit('batch-update');
            },
            {
              message: 'Os parâmetros foram atualizados com sucesso!',
              summary: 'Parâmetros Atualizados',
            }
          ),
          [dataClassesToInstall],
          {
            title: 'Atualizar em lote',
            question:
              'Tem certeza que deseja atualizar os parâmetros com o valor escolhido?',
          }
        )
    "
  >
    <q-select
      multiple
      clearable
      v-model="selectedParameters"
      :options="parameterOptions"
      use-chips
      stack-label
      label="Selecione os parâmetros"
      color="teal"
      outlined
    >
      <template v-slot:no-option>
        <q-item>
          <q-item-section class="text-italic text-grey">
            Nenhum parâmetro encontrado
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <q-input label="Valor" v-model="parametersNewValue" outlined color="teal" />
    <q-btn
      label="Salvar"
      type="submit"
      color="teal"
      :disable="isSaveButtonDisabled"
    />
  </q-form>
  <ConfirmActionDialog
    :confirm="confirm"
    :cancel="cancel"
    v-model="isRevealed"
    v-if="isRevealed"
  >
    <template #title>{{ confirmDialogState.title }}</template>
    <template #question>{{ confirmDialogState.question }}</template>
  </ConfirmActionDialog>
  <SuccessDialog
    :title="successDialogState.summary"
    :message="successDialogState.message"
    v-model="showSuccessDialog"
    v-if="showSuccessDialog"
  />
  <q-dialog v-model="showErrorDialog">
    <CommandErrorCard :error="error" />
  </q-dialog>
</template>

<script setup lang="ts">
import { useRobotParameters } from 'src/composables/parameters';
import useBluetooth, { BleError } from 'src/services/ble';
import CommandErrorCard from 'src/components/cards/CommandErrorCard.vue';
import ConfirmActionDialog from 'src/components/dialogs/ConfirmActionDialog.vue';
import SuccessDialog from 'src/components/dialogs/SuccessDialog.vue';
import {
  usePerformActionDialog,
  useSuccessFeedback,
} from 'src/composables/actions';
import { useErrorCapturing } from 'src/composables/error';
import { computed, ref, watchEffect } from 'vue';
import { useLoading } from 'src/composables/loading';
import { useIsTruthy } from 'src/composables/boolean';
import { useQuasar } from 'quasar';

const LOADING_GROUP = 'batch-parameter-update';

const props = defineProps<{ dataClasses: Robot.Parameters }>();
const emit = defineEmits(['batch-update']);

const { ble } = useBluetooth();
const $q = useQuasar();
const error = ref<BleError | null>(null);
const { installParameters: _installParameters } = useRobotParameters(
  ble,
  'UART_TX',
  'UART_RX'
);
const [_protectedInstallParameters] = useErrorCapturing(
  _installParameters,
  [BleError],
  error
);
const [installParameters, installingParameters] = useLoading(
  _protectedInstallParameters
);
const {
  isRevealed,
  confirm,
  cancel,
  performAction,
  state: confirmDialogState,
} = usePerformActionDialog();
const selectedParameters = ref<string[]>([]);
const { feedback: successDialogState, withSuccessFeedback } =
  useSuccessFeedback();
const parametersNewValue = ref('');
const dataClassesToInstall = computed(() => {
  const dataClassesToInstall: Robot.Parameters = new Map();
  for (const selectedParameter of selectedParameters.value) {
    const [dataClassKey, parameterKey] = selectedParameter.split('.');
    if (parameterKey) {
      const parameters = props.dataClasses.get(dataClassKey);
      if (parameters) {
        const parameter = parameters.get(parameterKey);
        if (parameter) {
          const dataClass = dataClassesToInstall.get(dataClassKey);
          if (dataClass) {
            dataClass.set(parameterKey, parametersNewValue.value);
          } else {
            dataClassesToInstall.set(
              dataClassKey,
              new Map([[parameterKey, parametersNewValue.value]])
            );
          }
        }
      }
    } else {
      const parameters = props.dataClasses.get(dataClassKey);
      if (parameters) {
        dataClassesToInstall.set(
          dataClassKey,
          new Map(
            Array.from(parameters).map(([key]) => [
              key,
              parametersNewValue.value,
            ])
          )
        );
      }
    }
  }
  return dataClassesToInstall;
});
const parameterOptions = computed(() =>
  Array.from(props.dataClasses.keys()).concat(
    Array.from(props.dataClasses).reduce(
      (acc, [dataClassKey, parameters]) =>
        acc.concat(
          Array.from(parameters.keys()).map(
            (parameterKey) => `${dataClassKey}.${parameterKey}`
          )
        ),
      []
    )
  )
);
const showSuccessDialog = useIsTruthy(successDialogState);
const showErrorDialog = useIsTruthy(error);
const isSaveButtonDisabled = computed(
  () => !parametersNewValue.value || selectedParameters.value.length == 0
);

watchEffect(() => {
  if (installingParameters.value) {
    $q.loading.show({
      message: 'Atualizando parâmetros...',
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'teal',
      group: LOADING_GROUP,
    });
  } else if ($q.loading.isActive) {
    $q.loading.hide(LOADING_GROUP);
  }
});
</script>
