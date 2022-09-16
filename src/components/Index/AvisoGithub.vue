<template>
  <!-- Se for iOS e não estiver utilizando o Bluefy -->
  <q-card v-if="$q.platform.is.android && userStore.getCurrentUser == null" bordered flat>
    <q-card-section>
      <div class="text-h6">
        <q-icon :name="mdiAlert" color="warning" /> Problema com login?
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section class="q-gutter-sm">
      <div class="text-body2 ">Se você possui o aplicativo GitHub instalado é necessário desabilitar a abertura de links
        suportados pelo aplicativo.</div>
      <div class="text-body2 ">Para isso acesse <b>Configurações > Aplicativos > GitHub > Definir como padrão > Ir para
          URLs suportados</b> e selecione <b>"Em outro aplicativo"</b>.</div>
      <div class="text-body2 "><b>Reinicie o navegador</b> após alterar a configuração.</div>

    </q-card-section>
  </q-card>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { mdiAlert } from '@quasar/extras/mdi-v6'
import { useAuth } from 'src/stores/auth';

const $q = useQuasar()
const userStore = useAuth()
</script>
