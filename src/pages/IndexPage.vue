<template>
  <q-page class="q-pa-lg">
    <q-card flat>
      <q-card-section>
        <div v-if="authStore.user" class="text-h5">
          Olá, {{ authStore.user.displayName.split(' ').at(0) }}!
        </div>
        <div v-else class="text-h5">Olá, Visitante!</div>
      </q-card-section>

      <q-separator inset />

      <q-card-section class="q-gutter-md">
        <!-- Avisos -->
        <aviso-github></aviso-github>
        <aviso-experimental-features></aviso-experimental-features>
        <aviso-navegador></aviso-navegador>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { useAuth } from 'src/stores/auth';
import { onBeforeRouteLeave } from 'vue-router';
import AvisoNavegador from '../components/Index/AvisoNavegador.vue';
import AvisoExperimentalFeatures from 'src/components/Index/AvisoExperimentalFeatures.vue';
import AvisoGithub from 'src/components/Index/AvisoGithub.vue';

const emit = defineEmits<{ (e: 'navigationGuard'): void }>();

const authStore = useAuth();
onBeforeRouteLeave((to) => {
  if (to.meta.requiresAuth && !authStore.getCurrentUser) {
    emit('navigationGuard');
  }
});
</script>
