<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="q-py-sm">
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>LF Dash</q-toolbar-title>
        <!-- <q-space></q-space> -->
        <div class="q-px-md q-gutter-sm">
          <ConnectBluetoothButton
            v-if="!connected"
            @bluetooth-connection-error="notifyBluetoothError"
          />
          <RobotChip
            v-else
            @low-battery="
              (currentVoltage: number) => lowBatteryDialog.warn(currentVoltage)
            "
          />
          <UserChip
            color="secondary"
            round
            @login="welcomeUser"
            @block="notifyBlock"
            @error="notifyError"
          />
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

    <q-dialog v-model="lowBatteryDialog.show">
      <BatteryWarningCard
        :current-voltage="lowBatteryDialog.voltage ?? 0"
      ></BatteryWarningCard>
    </q-dialog>
  </q-layout>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import {
  mdiTableLarge,
  mdiTune,
  mdiMenu,
  mdiHome,
  mdiRobotMowerOutline,
  mdiChartLine,
  mdiAccountCheck,
  mdiCloseOctagon,
  mdiAlertCircle,
  mdiAlertOctagon,
  mdiAlertBox,
} from '@quasar/extras/mdi-v6';
import { useQuasar } from 'quasar';
import UserChip from 'src/components/UserChip.vue';
import RobotChip from 'src/components/RobotChip.vue';
import BatteryWarningCard from 'src/components/cards/BatteryWarningCard.vue';
import ConnectBluetoothButton from 'src/components/buttons/ConnectBluetoothButton.vue';
import useBluetooth from 'src/services/ble';
import type { User, AuthError } from 'firebase/auth';

const { connected } = useBluetooth();

const drawer = ref(false);
const lowBatteryDialog = reactive({
  show: false,
  voltage: null,
  warned: false,
  warn(currentVoltage: number) {
    if (!this.warned) {
      // @ts-ignore
      this.voltage = currentVoltage;
      this.show = true;
      this.warned = true;
    }
  },
});
const $q = useQuasar();

function notifyBluetoothError(message: string) {
  return $q.notify({ message, color: 'negative', icon: mdiAlertBox });
}

function welcomeUser(user: User) {
  return $q.notify({
    message: `Bem-vind@ ${user.displayName?.split(' ').at(0)}!`,
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
  let message: string = 'Um erro inesperado ocorreu durante a autenticação.';
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
