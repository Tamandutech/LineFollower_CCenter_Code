<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="q-py-sm">
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>BraiaDash</q-toolbar-title>
        <q-space></q-space>
        <div class="q-px-md q-gutter-md">
          <q-btn color="secondary" round @click="bluetooth.isConnected ? BLE.disconnect() : BLE.connect()"
            :icon="bluetooth.isConnected ? mdiBluetoothOff : mdiBluetoothConnect" :loading="bluetooth.isConnecting">
            <template v-slot:loading>
              <q-spinner-radio class="on-center" />
            </template>
          </q-btn>
          <q-btn color="secondary" round @click="$q.fullscreen.toggle()"
            :icon="$q.fullscreen.isActive ? mdiFullscreenExit : mdiFullscreen" />
          <UserChip color="secondary" round :user="auth.user" @logout="logout"></UserChip>
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

          <q-expansion-item :content-inset-level="0.5" expand-separator :icon="mdiRobotMowerOutline" label="Robô"
            default-opened>
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
import { useRouter } from 'vue-router';
import { useQuasar, QSpinnerGears } from 'quasar';
import { FirebaseError } from '@firebase/util';
import useFirebase from 'src/services/firebase';
import { mdiTableLarge, mdiTune, mdiMenu, mdiHome, mdiRobotMowerOutline, mdiFullscreen, mdiFullscreenExit, mdiBluetoothConnect, mdiBluetoothOff, mdiAlertOctagon, mdiAlertCircle, mdiAccountCheck } from '@quasar/extras/mdi-v6';
import BLE from 'src/utils/ble';
import { useBluetooth } from 'stores/bluetooth';
import UserChip from 'src/components/UserChip.vue';
import { useAuth } from 'src/stores/auth';

const bluetooth = useBluetooth();
const drawer = ref(false);

const router = useRouter();
const $q = useQuasar();
const auth = useAuth();
auth.$onAction(({ name, store, after, onError }) => {
  if (name === 'loginUser') {
    $q.loading.show({
      message: 'Esperando autenticação via provedor...',
      backgroundColor: 'black',
      spinner: QSpinnerGears,
    });
  }

  after(() => {
    $q.loading.hide();

    if (name === 'logoutUser') {
      $q.notify({
        message: 'Acesso as funcionalidades permitido somente a usuários autenticados',
        icon: mdiAlertOctagon,
      });

      router.push({ path: '/login' });
    }

    if (name === 'loginUser') {
      $q.notify({
        message: `Bem-vind@ ${store.getCurrentUser.displayName.split(' ').at(0)}!`,
        color: 'positive',
        icon: mdiAccountCheck,
      });
    }
  });

  onError((error) => {
    $q.loading.hide();

    let message;
    if (error instanceof FirebaseError) {
      switch (error.code) {
        case 'auth/popup-blocked':
          message = 'O pop-up para autenticação via provedor foi bloqueada pelo navegador.';
          break;
        case 'auth/popup-closed-by-user':
          message = 'A autenticação é cancelada ao fechar o pop-up do provedor.';
          break;
        default:
          message = 'Um erro inesperado ocorreu no provedor de autenticação.';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    $q.notify({
      message: message,
      color: 'negative',
      icon: mdiAlertCircle,
    });
  });
});

const {
  auth: { service },
} = useFirebase();
const logout = () => auth.logoutUser(service);
</script>
