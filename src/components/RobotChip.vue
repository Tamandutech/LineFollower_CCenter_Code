<template>
  <q-btn :icon="mdiRobotMower" color="secondary" round>
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-list>
        <q-item clickable @click="fetchBatteryVoltage">
          <q-item-section avatar>
            <q-avatar :icon="mdiBatteryCharging"></q-avatar>
          </q-item-section>
          <q-item-section>{{ battery.voltage }}</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { useBattery } from 'stores/battery';
import { useRobotQueue } from 'stores/robotQueue';
import { battery_voltage } from 'src/utils/robot/commands/cmdParam';
import { mdiRobotMower, mdiBatteryCharging } from '@quasar/extras/mdi-v6';

const battery = useBattery();
const robotQueue = useRobotQueue();
function fetchBatteryVoltage() {
  robotQueue.addCommand(new battery_voltage());
}
</script>
