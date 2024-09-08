<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">Sistema</div>
    </q-card-section>
    <q-card-actions>
      <q-btn @click="pause" :loading="isPausing || isResuming" color="primary"
        >Parar</q-btn
      >
      <q-btn @click="resume" :loading="isPausing || isResuming" color="primary"
        >Andar</q-btn
      >
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import useBluetooth from 'src/services/ble';
import { useRobotSystem } from 'src/composables/system';
import { useAsyncState } from '@vueuse/core';

const { ble } = useBluetooth();
const { pause, resume } = useRobotSystem(ble, 'UART_TX', 'UART_RX');
const { isLoading: isPausing } = useAsyncState(pause, null);
const { isLoading: isResuming } = useAsyncState(resume, null);
</script>
