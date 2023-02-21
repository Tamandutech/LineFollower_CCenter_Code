<template>
  <q-card class="bg-grey-3">
    <q-card-section class="bg-grey-9 text-white">
      <h3 class="text-h5 q-my-xs">
        <q-avatar :icon="mdiChartLine" /> Transmissões
      </h3>
    </q-card-section>
    <slot></slot>
  </q-card>
</template>

<script setup lang="ts">
import { mdiChartLine } from '@quasar/extras/mdi-v6';
</script>
