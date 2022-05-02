<template>
  <q-card flat bordered class="my-card">
    <q-card-section>
      <div class="text-h6">PIDVel</div>
    </q-card-section>

    <!-- <q-card-section class="q-pt-none">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </q-card-section> -->

    <q-separator inset />

    <q-card-section>
      <div class="q-gutter-md" style="max-width: 300px">
        <q-input outlined v-model="text" label="Kp" />
        <q-input outlined v-model="text" label="Ki" />
        <q-input outlined v-model="text" label="Kd" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, toRef, Ref } from 'vue';
import { ClassName, Parameters } from './models';

function useClickCount() {
  const clickCount = ref(0);
  function increment() {
    clickCount.value += 1;
    return clickCount.value;
  }

  return { clickCount, increment };
}

function useDisplayTodo(todos: Ref<Todo[]>) {
  const todoCount = computed(() => todos.value.length);
  return { todoCount };
}

export default defineComponent({
  name: 'ExampleComponent',
  props: {
    title: {
      type: String,
      required: true,
    },
    todos: {
      type: Array as PropType<Todo[]>,
      default: () => [],
    },
    meta: {
      type: Object as PropType<Meta>,
      required: true,
    },
    active: {
      type: Boolean,
    },
  },
  setup(props) {
    return { ...useClickCount(), ...useDisplayTodo(toRef(props, 'todos')) };
  },
});
</script>
