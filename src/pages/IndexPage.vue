<template>
  <q-page class="q-pa-lg">
    <q-card flat>
      <q-card-section>
        <div v-if="authStore.user" class="text-h5">Olá, {{authStore.user.displayName.split(' ').at(0)}}!</div>
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

    <message-feedback-dialog></message-feedback-dialog>
  </q-page>
</template>

<script lang="ts">
import { useAuth } from 'src/stores/auth';
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar'
import AvisoNavegador from '../components/Index/AvisoNavegador.vue'
import AvisoExperimentalFeatures from 'src/components/Index/AvisoExperimentalFeatures.vue';
import AvisoGithub from 'src/components/Index/AvisoGithub.vue';

const authStore = useAuth();

export default defineComponent({
  name: 'IndexPage',
  components: { AvisoNavegador, AvisoExperimentalFeatures, AvisoGithub },

  setup() {
    const $q = useQuasar()

    function getLoggedUser() {
      if (authStore.getCurrentUser != null)
        return authStore.getCurrentUser.displayName.split(' ').at(0)
      else
        return 'Visitante'
    }

    return {
      getLoggedUser,
      authStore,
      $q
    }
  }
});
</script>
