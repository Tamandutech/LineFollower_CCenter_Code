<template>
  <q-page class="row items-center justify-evenly">
    <parameters-component :dataClass="pidVel"></parameters-component>
  </q-page>
</template>

<script lang="ts">
import ParametersComponent from 'src/components/ParametersComponent.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { ParametersComponent },
  data() {
    return {
      pidVel: {
        name: 'PIDVel',
        parameters: [
          { name: 'Kp', value: 0.5 },
          { name: 'Ki', value: 0.6 },
          { name: 'Kd', value: 0.7 },
        ],
      },
    };
  },
});
</script>
