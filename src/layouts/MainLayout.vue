<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="q-py-sm">
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>LF Dash</q-toolbar-title>
        <!-- <q-space></q-space> -->
        <div class="q-px-md q-gutter-sm">
          <q-btn
            color="secondary"
            round
            @click="bluetooth.isConnected ? BLE.disconnect() : BLE.connect()"
            :icon="
              bluetooth.isConnected ? mdiBluetoothOff : mdiBluetoothConnect
            "
            :loading="bluetooth.isConnecting"
          >
            <template v-slot:loading>
              <q-spinner-radio class="on-center" />
            </template>
          </q-btn>
          <RobotChip></RobotChip>
          <UserChip
            color="secondary"
            round
            :user="auth.user"
            @logout="logout"
          ></UserChip>
        </div>
      </q-toolbar>
    </q-header>

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

<script lang="ts" setup>
import { ref } from 'vue';
import useFirebase from 'src/services/firebase';
import {
  mdiTableLarge,
  mdiTune,
  mdiMenu,
  mdiHome,
  mdiRobotMowerOutline,
  mdiBluetoothConnect,
  mdiBluetoothOff,
} from '@quasar/extras/mdi-v6';
import BLE from 'src/utils/ble';
import { useBluetooth } from 'stores/bluetooth';
import RobotChip from 'components/RobotChip.vue';
import UserChip from 'src/components/UserChip.vue';
import { useAuth } from 'src/stores/auth';

const bluetooth = useBluetooth();
const drawer = ref(false);

const auth = useAuth();

const {
  auth: { service },
} = useFirebase();

const logout = () => auth.logoutUser(service);
</script>
