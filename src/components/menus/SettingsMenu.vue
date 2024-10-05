<template>
  <q-menu transition-show="jump-down" transition-hide="jump-up" fit>
    <div class="row no-wrap q-pa-md">
      <q-list>
        <q-item-label header>Robô</q-item-label>
        <q-item>
          <q-item-section avatar>
            <q-avatar :icon="mdiRobotMowerOutline"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Nome</q-item-label>
            <q-item-label caption>{{ session.robot?.name }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar>
            <q-avatar :icon="mdiBatteryCharging"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Bateria</q-item-label>
            <q-item-label caption>{{
              // @ts-ignore
              (battery.voltage / 1000).toFixed(2) + 'V'
            }}</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator inset spaced />

        <q-item-label header>Configurações</q-item-label>

        <q-item>
          <q-item-section avatar>
            <q-avatar :icon="mdiBatteryClock"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Atualizar tensão da bateria</q-item-label>
            <q-item-label caption>Interválo em minutos</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-select
              filled
              dense
              v-model="
                // @ts-ignore
                session.settings.batteryStatusUpdateInterval
              "
              :options="batteryStatusUpdateIntervalOptions"
              options-dense
              map-options
              color="teal-5"
            ></q-select>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar>
            <q-avatar :icon="mdiBatteryAlert"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Alerta sobre a tensão da bateria</q-item-label>
            <q-item-label caption>Limite em volts</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-select
              filled
              dense
              v-model="
                // @ts-ignore
                session.settings.batteryLowWarningThreshold
              "
              :options="batteryLowWarningThresholdOptions"
              options-dense
              map-options
              color="teal-5"
            ></q-select>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section avatar>
            <q-avatar :icon="mdiBatteryAlert"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>Notificação de baixa tensão da bateria</q-item-label>
            <q-item-label caption>Interválo em minutos</q-item-label>
          </q-item-section>
          <q-item-section side top>
            <q-select
              filled
              dense
              v-model="
                // @ts-ignore
                session.settings.batteryLowWarningInterval
              "
              :options="batteryLowWarningIntervalOptions"
              options-dense
              map-options
              color="teal-5"
            ></q-select>
          </q-item-section>
        </q-item>
        <q-item clickable @click="disconnect">
          <q-item-section avatar>
            <q-avatar :icon="mdiBluetoothOff"></q-avatar>
          </q-item-section>
          <q-item-section>Desconectar</q-item-section>
        </q-item>
      </q-list>
    </div>
  </q-menu>
</template>

<script lang="ts" setup>
import { useBattery } from 'stores/battery';
import { useSessionStore } from 'src/stores/session';
import useBluetooth from 'src/services/ble';
import {
  mdiRobotMower,
  mdiBatteryCharging,
  mdiRobotMowerOutline,
  mdiBatteryClock,
  mdiBatteryAlert,
  mdiBluetoothOff,
} from '@quasar/extras/mdi-v6';
import { onUnmounted, ref, watchEffect } from 'vue';
import { useTimeoutPoll, useCycleList } from '@vueuse/core';

const emit = defineEmits<{
  (e: 'low-battery', currentVoltage: number): void;
  (e: 'bluetooth-connection-error', message: string): void;
}>();

const ONE_MINUTE_IN_MILLISECONDS = 60000;
function getIntervalOption(interval: number): { value: number; label: string } {
  return {
    label:
      interval > 0
        ? (interval / ONE_MINUTE_IN_MILLISECONDS).toPrecision(2)
        : 'Nunca',
    value: interval,
  };
}

const { ble, disconnect } = useBluetooth();

const session = useSessionStore();
const battery = useBattery();
const { state: buttonIcon, next } = useCycleList(
  [mdiRobotMower, mdiBatteryAlert],
  { initialValue: mdiRobotMower },
);
const buttonColor = ref('teal-5');

const batteryStatusUpdateIntervalOptions = ref(
  [0, 60000, 150000, 300000, 600000].map(getIntervalOption),
);
const batteryLowWarningThresholdOptions = ref(
  [6000, 5000, 4000, 3000, 1500].map((threshold) => ({
    label: (threshold / 1000).toPrecision(2) + 'V',
    value: threshold,
  })),
);
const batteryLowWarningIntervalOptions = ref(
  [0, 60000, 150000, 300000, 600000].map(getIntervalOption),
);

let batteryLowWarningIntervalId: number;
battery.$subscribe((mutation, state) => {
  // @ts-ignore
  if (state.voltage <= session.settings.batteryLowWarningThreshold) {
    // @ts-ignore
    batteryLowWarningIntervalId = setInterval(
      next,
      ONE_MINUTE_IN_MILLISECONDS / 2,
    );
    buttonColor.value = 'warning';
    // @ts-ignore
    emit('low-battery', state.voltage);
  } else {
    clearInterval(batteryLowWarningIntervalId);
    buttonColor.value = 'teal-5';
    while (buttonIcon.value !== mdiRobotMower) next();
  }
});

function fetchBatteryVoltage() {
  battery.fetchVoltage(ble, 'UART_TX', 'UART_RX');
}

const { resume, pause } = useTimeoutPoll(
  fetchBatteryVoltage,
  // @ts-ignore
  session.settings.batteryStatusUpdateInterval,
  { immediate: false },
);
watchEffect(() => {
  // @ts-ignore
  return session.settings.batteryStatusUpdateInterval == 0
    ? pause()
    : ble.connected && resume();
});

// @ts-ignore
const unlistenResumeOnConnect = ble.onConnect(resume);
// @ts-ignore
const unlistenPauseOnDisconnect = ble.onDisconnect(pause);
onUnmounted(() => {
  unlistenPauseOnDisconnect();
  unlistenResumeOnConnect();
});
</script>
