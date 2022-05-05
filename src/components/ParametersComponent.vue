<template>
  <q-card flat bordered class="my-card">
    <q-card-section>
      <div class="text-h6">{{ dataClass.name }}</div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <div class="q-gutter-md" style="max-width: 300px">
        <q-input
          v-for="parameter in dataClass.parameters"
          :key="parameter.name"
          v-model="parameter.value"
          type="number"
          :label="parameter.name"
          :outlined="true"
          v-text="parameter.value"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { DataClass } from './models';

export default defineComponent({
  name: 'ExampleComponent',
  props: {
    dataClass: {
      type: Object as PropType<DataClass>,
      required: true,
    },
  },
});
</script>
