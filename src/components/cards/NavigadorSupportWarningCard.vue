<template>
  <!-- Se for Windows, Mac, Linux ou Android e não estiver utilizando navegador Chrome -->
  <q-card
    v-if="
      ($q.platform.is.android ||
        $q.platform.is.linux ||
        $q.platform.is.mac ||
        $q.platform.is.win) &&
      !$q.platform.is.chrome &&
      !$q.platform.is.edgeChromium
    "
    bordered
    flat
  >
    <q-card-section>
      <div class="text-h6">
        <q-icon :name="mdiAlert" color="warning" /> Navegador não suportado
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div class="text-body2">
        Detectamos que você está utilizando um navegador não testado. Para uso
        de todas as funções, como BLE Web e PWA, recomendamos um navegador
        baseado no Chromium, como o Google Chrome. Deseja instalar o navegador
        recomendado?
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions>
      <q-btn
        flat
        v-if="$q.platform.is.android"
        :icon="mdiGooglePlay"
        label="Instalar"
        href="market://details?id=com.android.chrome"
        target="_blank"
      />
      <q-btn
        flat
        v-else-if="$q.platform.is.win"
        :icon="mdiMicrosoftWindows"
        label="Instalar"
        href="https://www.google.com/chrome/"
        target="_blank"
      />
      <q-btn
        flat
        v-else-if="$q.platform.is.linux"
        :icon="mdiLinux"
        label="Instalar"
        href="https://www.google.com/chrome/"
        target="_blank"
      />
      <q-btn
        flat
        v-else-if="$q.platform.is.mac"
        :icon="mdiApple"
        label="Instalar"
        href="https://www.google.com/chrome/"
        target="_blank"
      />
    </q-card-actions>
  </q-card>

  <!-- Se for iOS e não estiver utilizando o Bluefy -->
  <q-card
    v-else-if="$q.platform.is.ios && !$q.platform.userAgent.includes('Bluefy')"
    bordered
    flat
  >
    <q-card-section>
      <div class="text-h6">
        <q-icon :name="mdiAlert" color="warning" /> Navegador não suportado
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div class="text-body2">
        Detectamos que você está utilizando um navegador não testado. Para uso
        de todas as funções, como BLE Web e PWA, no iPhone, recomendamos o
        navegador "Bluefy – Web BLE Browser". Deseja instalar o navegador
        recomendado?
      </div>
    </q-card-section>
    <q-separator />
    <q-card-actions>
      <q-btn
        flat
        :icon="mdiApple"
        label="Instalar"
        href="itms-apps://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055"
        target="_blank"
      />
    </q-card-actions>
  </q-card>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar';
import {
  mdiAlert,
  mdiGooglePlay,
  mdiMicrosoftWindows,
  mdiApple,
  mdiLinux,
} from '@quasar/extras/mdi-v6';

const $q = useQuasar();
</script>
