<template>
  <q-dialog v-model="show">
    <q-card
      :style="`width: ${props.width}px`"
      :bordered="props.bordered"
      :flat="props.flat"
      :dark="props.dark"
    >
      <q-card-section>
        <div class="text-h6">
          <slot name="title" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <slot name="question" />
      </q-card-section>

      <q-card-actions align="right" class="bg-white text-teal">
        <q-btn flat label="SIM" @click="close(confirm)" />
        <q-btn flat label="NÃO" @click="close(cancel)" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type Action = (data?: unknown) => void;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    confirm: Action;
    cancel: Action;
    bordered?: boolean;
    dark?: boolean;
    flat?: boolean;
    width?: number | string;
  }>(),
  { width: 500 },
);
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const show = computed({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

function close(action: Action): void {
  action();
  show.value = false;
}
</script>
