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
            @click="connected ? disconnect() : performConnect()"
            :icon="connected ? mdiBluetoothOff : mdiBluetoothConnect"
            :loading="connecting"
          >
            <template v-slot:loading>
              <q-spinner-radio class="on-center" />
            </template>
          </q-btn>
          <RobotChip></RobotChip>
          <UserChip
            color="secondary"
            round
            @login="welcomeUser"
            @block="notifyBlock"
            @error="notifyError"
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
            <q-item clickable :to="'/robot/stream'" exact>
              <q-item-section avatar>
                <q-icon :name="mdiChartLine" />
              </q-item-section>
              <q-item-section> Transmissão </q-item-section>
            </q-item>
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view @navigation-guard="notifyAuthenticationRequired" />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import {
  mdiTableLarge,
  mdiTune,
  mdiMenu,
  mdiHome,
  mdiRobotMowerOutline,
  mdiBluetoothConnect,
  mdiBluetoothOff,
  mdiChartLine,
  mdiAccountCheck,
  mdiCloseOctagon,
  mdiAlertCircle,
  mdiAlertOctagon,
  mdiAlertBox,
} from '@quasar/extras/mdi-v6';
import { useQuasar } from 'quasar';
import useBluetooth, { BleError } from 'src/services/ble';
import UserChip from 'src/components/UserChip.vue';
import RobotChip from 'src/components/RobotChip.vue';
import type { User, AuthError } from 'firebase/auth';

const drawer = ref(false);
const $q = useQuasar();

const { connected, connecting, connect, disconnect } = useBluetooth();

async function performConnect() {
  try {
    await connect();
  } catch (error) {
    const message =
      error instanceof BleError
        ? error.message
        : 'Ocorreu um erro durante a conexão com o robô. Tente novamente.';

    $q.notify({
      message,
      color: 'negative',
      icon: mdiAlertBox,
    });
  }
}

function welcomeUser(user: User) {
  return $q.notify({
    message: `Bem-vind@ ${user.displayName.split(' ').at(0)}!`,
    color: 'positive',
    icon: mdiAccountCheck,
  });
}

function notifyBlock() {
  return $q.notify({
    message:
      'Você precisa ser membro da Tamandutech no Github para acessar a plataforma.',
    icon: mdiCloseOctagon,
    color: 'negative',
  });
}

function notifyError(error: AuthError) {
  let message: string;
  if (error.hasOwnProperty('code')) {
    switch (error.code) {
      case 'auth/user-cancelled':
        message = 'A autenticação é cancelada ao sair da página do provedor.';
        break;
      default:
        message = 'Um erro inesperado ocorreu durante a autenticação.';
    }
  }
  return $q.notify({
    message: message,
    color: 'negative',
    icon: mdiAlertCircle,
  });
}

function notifyAuthenticationRequired() {
  return $q.notify({
    message:
      'Acesso as funcionalidades permitido somente a usuários autenticados',
    icon: mdiAlertOctagon,
  });
}
</script>
