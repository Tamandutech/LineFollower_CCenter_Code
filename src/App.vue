<template>
  <queue-controller />
  <router-view />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import QueueController from 'components/QueueController.vue';

export default defineComponent({
  name: 'App',
  components: { QueueController },

  mounted() {
    console.log('Aplicação montada...');
  },
});
</script>
