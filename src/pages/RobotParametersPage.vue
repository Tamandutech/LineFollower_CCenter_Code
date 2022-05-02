<template>
  <q-page class="row items-center justify-evenly">
    <example-component title="Example component" active :todos="todos" :meta="meta"></example-component>

    <example-component title="Example component" active :todos="todos" :meta="meta"></example-component>

    <example-component title="Example component" active :todos="todos" :meta="meta"></example-component>
  </q-page>
</template>

<script lang="ts">
import { Todo, Meta } from '../components/models';
import ExampleComponent from 'components/ExampleComponent.vue';
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { ExampleComponent },
  setup() {
    const todos = ref<Todo[]>([
      {
        id: 1,
        content: 'ct1',
      },
      {
        id: 2,
        content: 'ct2',
      },
      {
        id: 3,
        content: 'ct3',
      },
      {
        id: 4,
        content: 'ct4',
      },
    ]);

    const meta = ref<Meta>({
      totalCount: 1500,
    });

    return { todos, meta };
  },
});
</script>
