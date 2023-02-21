<template>
  <q-card>
    <q-card-section class="row items-center text-white bg-negative">
      <div class="text-h5">Erro <q-icon :name="state.icon"></q-icon></div>
      <q-space />
      <q-btn
        :icon="mdiClose"
        flat
        round
        dense
        @click="emit('dismiss')"
        v-close-popup
      />
    </q-card-section>

    <q-card-section>{{ state.message }} </q-card-section>
    <q-card-section class="row items-center q-pa-xs bg-grey-3">
      <q-avatar size="md" :icon="mdiLightbulbOnOutline"></q-avatar>
      <div class="text-caption">
        {{ state.action }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import {
  mdiBluetoothOff,
  mdiLightbulbOnOutline,
  mdiBug,
  mdiClose,
} from '@quasar/extras/mdi-v6';
import { reactive } from 'vue';
import { BleError } from 'src/services/ble/errors';

const props = defineProps<{ error: unknown }>();
const emit = defineEmits(['dismiss']);
const isBluetoothError = props.error instanceof BleError;
const state = reactive(
  isBluetoothError
    ? {
        icon: mdiBluetoothOff,
        message: props.error.message,
        action: props.error.action,
      }
    : {
        icon: mdiBug,
        message:
          'Ocorreu um erro inesperado durante a atualização dos parâmetros',
        action: 'Contacte os desenvolvedores',
      }
);
</script>
