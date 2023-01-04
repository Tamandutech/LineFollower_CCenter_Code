<template>
  <q-page padding>
    <!-- content -->
    {{ parameters }}
  </q-page>
</template>

<script lang="ts" setup>
import useRobotRuntime from 'src/composables/useRobotRuntime';
import useRobotDataStream from 'src/composables/useRobotDataStream';
import useBluetooth from 'src/services/ble';
import { watch } from 'vue';

const { ble, connected } = useBluetooth();

const { parameters, updateParameters } = useRobotRuntime(ble, 'UART_TX');
const { start, stop } = useRobotDataStream(ble, 'STREAM_TX', 'UART_TX');

watch(connected, (value) => {
  if (!value) return;

  setTimeout(async () => {
    await updateParameters();
    start('speed.VelRot', 1000, (values) => console.log(values));
    setTimeout(() => stop('speed.VelRot'), 5000);
  }, 2400);
});
</script>
