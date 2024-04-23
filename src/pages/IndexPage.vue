<template>
  <q-page class="q-pa-lg row justify-center items-center" v-if="auth.isLoading">
    <q-spinner color="primary" size="3em" class="col-auto" />
  </q-page>
  <template v-else>
    <q-page class="q-pa-lg row justify-center items-center" v-if="!connected">
      <p class="text-grey-6">Nenhum robô conectado</p>
    </q-page>
    <q-page class="q-gutter-md q-pa-lg" v-else>
      <line-follower-cli class="col-auto" />
      <system-card />
    </q-page>
  </template>
</template>

<script lang="ts" setup>
import { useAuth } from 'src/stores/auth';
import useBluetooth from 'src/services/ble';
import { onBeforeRouteLeave } from 'vue-router';
import LineFollowerCli from 'src/components/LineFollowerCli.vue';
import SystemCard from 'src/components/cards/SystemCard.vue';
import { warnings } from 'src/constants/warnings';
import { useQuasar } from 'quasar';
import { mdiAlert } from '@quasar/extras/mdi-v6';

const emit = defineEmits<{ (e: 'navigationGuard'): void }>();

const $q = useQuasar();
const auth = useAuth();
const { connected } = useBluetooth();
onBeforeRouteLeave((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    emit('navigationGuard');
  }
});

for (const warning of warnings.filter((w) =>
  w.condition($q.platform, auth.isAuthenticated)
)) {
  $q.notify({
    icon: mdiAlert,
    message: warning.description,
    caption: warning.title,
    color: 'warning',
    position: 'bottom',
    timeout: 5000,
    actions: [
      { label: 'Ignorar', color: 'white', href: undefined },
      ...(warning.actions instanceof Array
        ? warning.actions
        : warning.actions($q.platform)),
    ].map((action) => ({
      ...action,
      handler: () => {
        if (action.href) {
          window.open(action.href, '_blank');
        }
      },
    })),
  });
}
</script>
