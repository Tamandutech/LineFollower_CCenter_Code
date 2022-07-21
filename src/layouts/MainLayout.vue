<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>BraiaDash</q-toolbar-title>
        <q-space></q-space>
        <div class="q-px-md q-gutter-sm">
          <q-btn
            color="secondary"
            @click="
              BluetoothStore.isConnected ? BLE.disconnect() : BLE.connect()
            "
            :icon="
              BluetoothStore.isConnected ? mdiBluetoothOff : mdiBluetoothConnect
            "
            :loading="BluetoothStore.isConnecting"
          >
            <template v-slot:loading>
              <q-spinner-radio class="on-center" /> </template
          ></q-btn>

          <q-btn
            color="secondary"
            @click="$q.fullscreen.toggle()"
            :icon="$q.fullscreen.isActive ? mdiFullscreenExit : mdiFullscreen"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- <q-footer elevated>
      <q-toolbar>
        <q-toolbar>
          <div class="absolute-center">Teste</div>
        </q-toolbar>
      </q-toolbar>
    </q-footer> -->

    <q-drawer
      v-model="drawer"
      show-if-above
      :width="300"
      :breakpoint="500"
      bordered
      class="bg-grey-3"
    >
      <q-scroll-area class="fit">
        <q-list>
          <q-item clickable :to="'/'" exact>
            <q-item-section avatar>
              <q-icon :name="mdiHome" />
            </q-item-section>
            <q-item-section> Início </q-item-section>
          </q-item>

          <q-separator />

          <q-expansion-item
            :content-inset-level="0.5"
            expand-separator
            :icon="mdiRobotMowerOutline"
            label="Robô"
            default-opened
          >
            <q-item clickable :to="'/robot/parameters'" exact>
              <q-item-section avatar>
                <q-icon :name="mdiTune" />
              </q-item-section>
              <q-item-section> Parâmetros </q-item-section>
            </q-item>
            <q-item clickable :to="'/robot/mapping'" exact>
              <q-item-section avatar>
                <q-icon :name="mdiTableLarge" />
              </q-item-section>
              <q-item-section> Mapeamento </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue';
// import { Bluetooth, connect } from './../ble';
import BLE from '../utils/ble';
import { useBluetoothStore } from './../stores/bluetooth';

import {
  mdiTableLarge,
  mdiTune,
  mdiMenu,
  mdiHome,
  mdiRobotMowerOutline,
  mdiFullscreen,
  mdiFullscreenExit,
  mdiBluetoothConnect,
  mdiBluetoothOff,
} from '@quasar/extras/mdi-v6';

export default {
  setup() {
    const BluetoothStore = useBluetoothStore();

    return {
      mdiTune,
      mdiMenu,
      mdiHome,
      mdiRobotMowerOutline,
      mdiFullscreen,
      mdiFullscreenExit,
      mdiTableLarge,
      mdiBluetoothConnect,
      mdiBluetoothOff,

      drawer: ref(false),

      BLE,
      BluetoothStore,
    };
  },
};
</script>
