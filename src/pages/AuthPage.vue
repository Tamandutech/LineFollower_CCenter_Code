<template>
  <q-page class="row justify-center items-center">
    <q-card>
      <q-card-section class="bg-teal text-center">
        <q-avatar :icon="mdiBadgeAccountOutline" size="200px" text-color="white" />
      </q-card-section>
      <q-card-section class="text-grey-7"> Faça login via Github para usar as funcionalidades da dashboard </q-card-section>
      <q-card-actions vertical>
        <GitHubLoginButton></GitHubLoginButton>
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script lang="ts" setup>
import { mdiBadgeAccountOutline } from '@quasar/extras/mdi-v6';
import GitHubLoginButton from 'components/GitHubLoginButton.vue';
</script>
