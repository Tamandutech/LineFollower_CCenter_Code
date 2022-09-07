<template>
  <q-btn color="secondary" @click="login">
    <slot>Login</slot>
  </q-btn>
</template>

<script lang="ts" setup>
import { useAuth } from 'stores/auth';
import useFirebase from 'src/services/firebase';
import { useDebounceFn } from '@vueuse/core';

const auth = useAuth();
const {
  auth: { service, provider },
} = useFirebase();

const login = useDebounceFn(() => auth.loginUser({ service, provider }), 5000);
</script>
