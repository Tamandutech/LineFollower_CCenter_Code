<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>BraiaDash</q-toolbar-title>
        <q-space></q-space>
        <div class="q-px-md q-gutter-sm">
          <q-btn color="secondary" @click="bluetooth.isConnected ? BLE.disconnect() : BLE.connect()" :icon="bluetooth.isConnected ? mdiBluetoothOff : mdiBluetoothConnect" :loading="bluetooth.isConnecting">
            <template v-slot:loading> <q-spinner-radio class="on-center" /> </template
          ></q-btn>
          <q-btn color="secondary" @click="$q.fullscreen.toggle()" :icon="$q.fullscreen.isActive ? mdiFullscreenExit : mdiFullscreen" />
          <UserChip class="q-px-md" v-if="auth.user" :user="auth.user"></UserChip>
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

    <q-drawer v-model="drawer" show-if-above :width="300" :breakpoint="500" bordered class="bg-grey-3">
      <q-scroll-area class="fit">
        <q-list>
          <q-item clickable :to="'/'" exact>
            <q-item-section avatar>
              <q-icon :name="mdiHome" />
            </q-item-section>
            <q-item-section> Início </q-item-section>
          </q-item>

          <q-separator />

          <q-expansion-item :content-inset-level="0.5" expand-separator :icon="mdiRobotMowerOutline" label="Robô" default-opened>
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

<script lang="ts" setup>
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { mdiTableLarge, mdiTune, mdiMenu, mdiHome, mdiRobotMowerOutline, mdiFullscreen, mdiFullscreenExit, mdiBluetoothConnect, mdiBluetoothOff } from '@quasar/extras/mdi-v6';
import BLE from 'src/utils/ble';
import { useBluetooth } from 'stores/bluetooth';
import UserChip from 'src/components/UserChip.vue';
import { useAuth } from 'src/stores/auth';

const $q = useQuasar();
const bluetooth = useBluetooth();
const drawer = ref(false);
const auth = useAuth();
</script>
