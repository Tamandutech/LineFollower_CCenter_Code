<template>
  <q-chip v-if="user">
    <q-avatar>
      <img :src="props.user.photoURL" />
    </q-avatar>
    {{ user.displayName }}
    <q-menu>
      <q-btn :icon="mdiExport" flat label="Logout" @click="logout"></q-btn>
    </q-menu>
  </q-chip>
</template>

<script lang="ts" setup>
import type { User } from 'firebase/auth';
import { mdiExport } from '@quasar/extras/mdi-v6';
import { useQuasar, QSpinnerGears } from 'quasar';
import { useRouter } from 'vue-router';
import useFirebase from 'src/services/firebase';
import { useAuth } from 'src/stores/auth';

const emit = defineEmits(['logout']);
const props = defineProps<{ user: User }>();

const $q = useQuasar();
const router = useRouter();
const auth = useAuth();
auth.$onAction(({ name, after, onError }) => {
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
        color: 'info',
      });
      router.push({ path: '/login' });
    }

    if (name === 'loginUser') {
      $q.notify({
        message: 'Bem-Vindo!',
        color: 'positive',
      });
    }
  });

  onError((error) => {
    $q.loading.hide();

    $q.notify({
      message: error instanceof Error ? error.message : '',
      color: 'negative',
    });
  });
});

const {
  auth: { service },
} = useFirebase();
const logout = () => {
  emit('logout');
  auth.logoutUser(service);
};
</script>
