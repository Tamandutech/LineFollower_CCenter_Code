<template>
  <q-btn>
    <q-avatar style="font-size: 42px;">
      <img :src="props.user.photoURL" />
    </q-avatar>
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-list>
        <q-item clickable v-close-popup>
          <q-item-section>
            <q-item-label>{{ user.displayName }}</q-item-label>
            <q-item-label caption>{{ user.email }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item clickable @click="emit('logout')">
          <q-item-section avatar>
            <q-avatar :icon="mdiExport"></q-avatar>
          </q-item-section>
          <q-item-section>Logout</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import type { User } from 'firebase/auth';
import { mdiExport } from '@quasar/extras/mdi-v6';

const emit = defineEmits(['logout']);
const props = defineProps<{ user: User }>();
</script>
