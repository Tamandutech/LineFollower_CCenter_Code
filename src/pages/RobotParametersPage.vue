<template>
  <q-page>
    <q-dialog v-model="showErrorDialog">
      <CommandErrorCard :error="error" />
    </q-dialog>
    <div class="q-pa-md">
      <q-table
        grid
        card-container-class="row wrap justify-start items-baseline"
        title="Classes"
        :rows="rows"
        :columns="columns"
        row-key="name"
        :filter="filter"
        hide-header
        hide-bottom
      >
        <template v-slot:top-left>
          <q-btn-group>
            <q-btn
              :loading="loading === listParameters.name"
              :icon="mdiRefreshCircle"
              @click="listParameters"
              color="primary"
            >
              <template v-slot:loading>
                <q-spinner-hourglass class="on-center" />
              </template>
            </q-btn>
            <q-btn
              :icon="mdiSourceBranch"
              @click="toogleVersionsDialog(true)"
              :disable="!ble.connected"
            />
          </q-btn-group>
        </template>

        <template v-slot:top-right>
          <q-input
            borderless
            dense
            debounce="300"
            v-model="filter"
            placeholder="Procurar"
          >
            <template v-slot:append>
              <q-icon :name="mdiMagnify" />
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
                        <q-popup-edit
                          :model-value="props.row.value"
                          @save="
                            async (newValue: Robot.ParameterValue) => {
                              await setParameter(
                                props.row.class,
                                props.row.name,
                                newValue
                              );
                              await getParameter(
                                props.row.class,
                                props.row.name
                              );
                            }
                          "
                          :title="props.row.name"
                          buttons
                          v-slot="scope"
                        >
                          <q-input
                            type="number"
                            v-model="scope.value"
                            dense
                            autofocus
                          />
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
    <ProfileVersionsDialog
      collection="parameters"
      title="Parâmetros"
      :data="dataClasses"
      :converter="profileConverter"
      @install-request="
        (version: Robot.ProfileVersion<Robot.Parameters>) =>
          performAction(
            withSuccessFeedback(
              installParameters,
              {message: 'Versão instalada com sucesso!', summary: 'Parâmetros instalados'}
            ),
            [version.data],
            {
              title: 'Instalar Versão',
              question: 'Tem certeza que deseja instalar a versão selecionada dos parâmetros?'
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
          v-for="[dataclass, parameters] of version.data"
          :key="dataclass"
          :label="dataclass"
          :caption="`${parameters.size} parâmetros`"
        >
          <q-list separator>
            <q-item v-for="[parameter, value] of parameters" :key="parameter">
              <q-item-section>{{ parameter }}</q-item-section>
              <q-item-section side>{{ value }}</q-item-section>
            </q-item>
          </q-list>
        </q-expansion-item>
      </q-list>
    </ProfileVersionsDialog>
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
  </q-page>
</template>

<script lang="ts" setup>
import {
  useRobotParameters,
  profileConverter,
} from 'src/composables/parameters';
import { useIsTruthy } from 'src/composables/boolean';
import useBluetooth from 'src/services/ble';
import CommandErrorCard from 'src/components/cards/CommandErrorCard.vue';
import ProfileVersionsDialog from 'src/components/dialogs/ProfileVersionsDialog.vue';
import ConfirmActionDialog from 'src/components/dialogs/ConfirmActionDialog.vue';
import SuccessDialog from 'src/components/dialogs/SuccessDialog.vue';
import {
  usePerformActionDialog,
  useSuccessFeedback,
} from 'src/composables/actions';
import {
  mdiSourceBranch,
  mdiRefreshCircle,
  mdiMagnify,
} from '@quasar/extras/mdi-v6';
import { useQuasar } from 'quasar';
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useToggle } from '@vueuse/core';

const { ble } = useBluetooth();
const {
  dataClasses,
  loading,
  error,
  listParameters,
  getParameter,
  setParameter,
  installParameters,
} = useRobotParameters(ble, 'UART_TX', 'UART_RX');

const [showVersionsDialog, toogleVersionsDialog] = useToggle(false);
const showErrorDialog = useIsTruthy(error);

const filter = ref('');

const columns = [
  { name: 'name', label: 'Name', field: 'name' },
  { name: 'calories', label: 'Calories (g)', field: 'calories' },
];
const rows = computed(() =>
  [...dataClasses.value.entries()].map(([className, parameters]) => ({
    name: className,
    parameters: [...parameters.entries()].map(([parameterName, value]) => ({
      name: parameterName,
      class: className,
      value,
    })),
  }))
);

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

const $q = useQuasar();
watchEffect(() => {
  if (loading.value === installParameters.name) {
    $q.loading.show({
      message: 'Instalando parâmetros...',
      boxClass: 'bg-grey-2 text-grey-9',
      spinnerColor: 'teal',
    });
  } else if ($q.loading.isActive) {
    $q.loading.hide();
  }
});

onMounted(async () => {
  if (ble.connected) await listParameters();
});
</script>
