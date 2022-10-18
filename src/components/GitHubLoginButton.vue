<template>
  <q-btn color="black" @click="login" :icon="mdiGithub" label="GitHub" />
</template>

<script lang="ts" setup>
import { useAuth } from 'stores/auth';
import { useThrottleFn } from '@vueuse/core';
import { mdiGithub } from '@quasar/extras/mdi-v6';
import type { AuthError } from 'firebase/auth';

const emit = defineEmits<{
  (e: 'error', error: Error): void;
}>();

const auth = useAuth();
const login = useThrottleFn(async () => {
  try {
    await auth.loginUser();
  } catch (error) {
    emit('error', error as AuthError);
  }
}, 5000);
</script>
