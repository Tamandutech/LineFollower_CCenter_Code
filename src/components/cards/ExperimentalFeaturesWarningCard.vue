<template>
  <!-- Se for iOS e não estiver utilizando o Bluefy -->
  <q-card
    v-if="
      $q.platform.is.linux ||
      ($q.platform.is.win && !$q.platform.userAgent.includes('Windows NT 10'))
    "
    bordered
    flat
  >
    <q-card-section>
      <div class="text-h6">
        <q-icon :name="mdiAlert" color="warning" /> Ação necessária
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div class="text-body2">
        Você está utilizando um sistema operacional Linux ou Windows anterior a
        versão 10. É necessário habilitar os recursos experimentais do Chrome.
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions>
      <q-btn
        flat
        :icon="mdiTestTube"
        label="Acessar"
        href="about://flags/#enable-experimental-web-platform-features"
        target="_blank"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { mdiAlert, mdiTestTube } from '@quasar/extras/mdi-v6';

const $q = useQuasar();
</script>
