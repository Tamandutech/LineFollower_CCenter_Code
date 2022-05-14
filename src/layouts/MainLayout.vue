<template>
  <q-layout view="hHh LpR fFf">

    <q-header elevated>
      <q-toolbar>
        <q-btn flat @click="drawer = !drawer" round dense :icon="mdiMenu" />
        <q-toolbar-title>BraiaDash</q-toolbar-title>
        <q-space></q-space>
        <q-btn color="secondary" @click="$q.fullscreen.toggle()"
          :icon="$q.fullscreen.isActive ? mdiFullscreenExit : mdiFullscreen" />
      </q-toolbar>
    </q-header>

    <q-footer elevated>
      <q-toolbar>
        <q-toolbar>
          <div class="absolute-center">Teste</div>
        </q-toolbar>
      </q-toolbar>
    </q-footer>

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
          </q-expansion-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { ref } from 'vue';

import { mdiTune, mdiMenu, mdiHome, mdiRobotMowerOutline, mdiFullscreen, mdiFullscreenExit } from '@quasar/extras/mdi-v6';

export default {
  setup() {
    return {
      mdiTune,
      mdiMenu,
      mdiHome,
      mdiRobotMowerOutline,
      mdiFullscreen,
      mdiFullscreenExit,

      drawer: ref(false),
    };
  },
};
</script>
