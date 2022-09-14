<template>
  <q-btn color="black" @click="login" :icon="mdiGithub" label="GitHub"/>
</template>

<script lang="ts" setup>
import { useAuth } from 'stores/auth';
import useFirebase from 'src/services/firebase';
import { useThrottleFn } from '@vueuse/core';
import { mdiGithub } from '@quasar/extras/mdi-v6';

const auth = useAuth();
const {
  auth: { service, github_provider },
} = useFirebase();

const login = useThrottleFn(() => auth.loginUser({ service, github_provider }), 5000);
</script>
