<template>
  <q-btn v-if="props.user">
    <q-avatar style="font-size: 42px;">
      <img :src="props.user.photoURL" />
    </q-avatar>
    <q-menu fit transition-show="jump-down" transition-hide="jump-up">
      <div class="row no-wrap q-pa-md">
        <q-list>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>Nome</q-item-label>
              <q-item-label caption>{{ user.displayName }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>E-mail</q-item-label>
              <q-item-label caption>{{ user.email }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup>
            <q-item-section>
              <q-item-label>Autenticador</q-item-label>
              <q-item-label caption>{{ user.providerData[0].providerId }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator inset spaced />

          <q-item clickable @click="emit('logout')">
            <q-item-section avatar>
              <q-avatar :icon="mdiExport"></q-avatar>
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-menu>
  </q-btn>

  <q-btn :icon="mdiAccountOff" v-else>
    <q-menu fit transition-show="jump-down" transition-hide="jump-up">
      <div class="row no-wrap q-pa-md">
        <div class="column items-center">
          <div class="text-subtitle1 q-mb-md">Login</div>

          <GitHubLoginButton></GitHubLoginButton>
          <!-- <q-btn color="primary" label="Logout" push size="sm" v-close-popup /> -->
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import type { User } from 'firebase/auth';
import { mdiExport, mdiAccountOff } from '@quasar/extras/mdi-v6';
import GitHubLoginButton from 'components/GitHubLoginButton.vue';

const emit = defineEmits(['logout']);
const props = defineProps<{ user: User }>();
</script>
