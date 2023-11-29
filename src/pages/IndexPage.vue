<template>
  <q-page class="q-pa-lg">
    <q-card flat>
      <q-card-section>
        <div v-if="auth.user" class="text-h5">
          Olá, {{ auth.user.displayName.split(' ').at(0) }}!
        </div>
        <div v-else class="text-h5">Olá, Visitante!</div>
      </q-card-section>

      <q-separator inset />

      <q-card-section class="q-gutter-md">
        <!-- Avisos -->
        <github-open-auth-app-warning-card></github-open-auth-app-warning-card>
        <experimental-features-warning-card></experimental-features-warning-card>
        <browser-support-warning-card></browser-support-warning-card>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { useAuth } from 'src/stores/auth';
import { onBeforeRouteLeave } from 'vue-router';
import BrowserSupportWarningCard from '../components/cards/NavigadorSupportWarningCard.vue';
import ExperimentalFeaturesWarningCard from 'src/components/cards/ExperimentalFeaturesWarningCard.vue';
import GithubOpenAuthAppWarningCard from 'src/components/cards/GithubOpenAuthAppWarningCard.vue';

const emit = defineEmits<{ (e: 'navigationGuard'): void }>();

const auth = useAuth();
onBeforeRouteLeave((to) => {
  if (to.meta.requiresAuth && !auth.user) {
    emit('navigationGuard');
  }
});
</script>
