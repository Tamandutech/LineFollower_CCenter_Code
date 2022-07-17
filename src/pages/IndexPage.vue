<template>
  <q-page class="q-pa-md">
    <line-follower-cli robotName="Braia" />
  </q-page>
</template>

<script lang="ts">
import LineFollowerCli from 'components/LineFollowerCli.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { LineFollowerCli },
});
</script>
