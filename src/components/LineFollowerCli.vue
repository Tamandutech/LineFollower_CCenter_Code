<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between">
        <div class="col-auto">
          <p class="text-h6 block">Linha de comandos</p>
          <p class="text-subtitle2 text-grey-7">{{ ble.name }}</p>
        </div>
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <q-input
        standout
        v-model="command"
        prefix="$"
        @keyup.enter="runCommand"
        @keyup.arrow-up="updateCursor('up')"
        @keyup.arrow-down="updateCursor('down')"
      >
        <template v-slot:hint>Digite o comando...</template>
      </q-input>
    </q-card-section>
    <q-card-section>
      <div
        :class="{
          'bg-grey-3': !!result,
          'bg-negative': !!error,
          'text-white': !!error,
        }"
        class="q-pa-sm rounded-borders q-m-none"
      >
        {{ result || (error && (error as BleError).message) }}
      </div>
    </q-card-section>
    <q-card-actions>
      <q-btn @click="runCommand" :loading="isLoading" color="primary"
        >Executar</q-btn
      >
      <template v-if="$q.platform.is.mobile">
        <q-btn
          @click="updateCursor('up')"
          color="primary"
          flat
          :icon="mdiArrowUpThick"
        />
        <q-btn
          @click="updateCursor('down')"
          color="primary"
          flat
          :icon="mdiArrowDownThick"
        />
      </template>
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import useBluetooth, { BleError } from 'src/services/ble';
import { useAsyncState, useManualRefHistory } from '@vueuse/core';
import { withTimeout } from 'src/lib/promises';
import { TimeoutError } from 'src/services/ble';
import { useQuasar } from 'quasar';
import { mdiArrowUpThick, mdiArrowDownThick } from '@quasar/extras/mdi-v6';

const $q = useQuasar();
const { ble } = useBluetooth();
const cursor = ref(-1);
const command = ref('');
const { history, commit } = useManualRefHistory(command);
const {
  state: result,
  isLoading,
  error,
  execute,
} = useAsyncState(
  () =>
    withTimeout(
      ble.request('UART_TX', 'UART_RX', command.value),
      5,
      new TimeoutError({ message: 'Comando excedeu o tempo limite' })
    ),
  null,
  {
    immediate: false,
  }
);

watchEffect(() => {
  if (cursor.value === -1) {
    command.value = '';
  } else {
    command.value = history.value[cursor.value].snapshot;
  }
});

function runCommand() {
  commit();
  execute();
  command.value = '';
  cursor.value = -1;
}

function updateCursor(direction: 'up' | 'down') {
  if (direction === 'up') {
    cursor.value = Math.min(cursor.value + 1, history.value.length - 2);
  } else if (direction === 'down') {
    cursor.value = Math.max(cursor.value - 1, -1);
  }
}
</script>
