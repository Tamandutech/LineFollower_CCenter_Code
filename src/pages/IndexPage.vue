<template>
  <q-page class="row items-center justify-evenly">
    <parameters-component :dataClass="pidVel"></parameters-component>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: {},
});
</script>
