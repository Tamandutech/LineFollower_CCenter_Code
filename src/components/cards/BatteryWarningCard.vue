<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">
        <q-avatar :icon="mdiBatteryAlert" />
        Bateria fraca
      </div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      A tensão atual da bateria alimentando o microcontrolador do robô é de
      {{ props.currentVoltage + 'mV' }}. Talvez seja necessário recarregar.
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="OK" color="warning" v-close-popup />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { mdiBatteryAlert } from '@quasar/extras/mdi-v6';

const props = defineProps<{ currentVoltage: number }>();
</script>
