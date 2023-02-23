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
          <q-btn
            :loading="loading"
            :icon="mdiRefreshCircle"
            @click="listParameters"
            color="primary"
          >
            <template v-slot:loading>
              <q-spinner-hourglass class="on-center" />
            </template>
          </q-btn>
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
                        <q-popup-edit
                          :model-value="props.row.value"
                          @save="
                            async (newValue) => {
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
  </q-page>
</template>

<script lang="ts" setup>
import { useRobotParameters } from 'src/composables/parameters';
import { mdiDatabaseSearch, mdiRefreshCircle } from '@quasar/extras/mdi-v6';
import useBluetooth from 'src/services/ble';
import CommandErrorCard from 'src/components/cards/CommandErrorCard.vue';
import { ref, computed, onMounted } from 'vue';

const { ble } = useBluetooth();
const {
  dataClasses,
  loading,
  error,
  errorCaptured: showErrorDialog,
  listParameters,
  getParameter,
  setParameter,
} = useRobotParameters(ble, 'UART_TX', 'UART_RX');
const filter = ref('');

const columns = [
  { name: 'name', label: 'Name', field: 'name' },
  { name: 'calories', label: 'Calories (g)', field: 'calories' },
];
const rows = computed(() =>
  [...dataClasses.entries()].map(([className, parameters]) => ({
    name: className,
    parameters: [...parameters.entries()].map(([parameterName, value]) => ({
      name: parameterName,
      class: className,
      value,
    })),
  }))
);

onMounted(async () => {
  if (ble.connected) await listParameters();
});
</script>
