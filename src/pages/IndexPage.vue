<template>
  <q-page class="q-pa-md">
    <line-follower-cli robotName="Braia" />
    <message-feedback-dialog></message-feedback-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: {},
});
</script>
