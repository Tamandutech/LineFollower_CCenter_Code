<template>
  <canvas ref="canvas" :x-data="data"></canvas>
</template>

<script setup lang="ts">
import { colors } from 'quasar';
import Chart from 'chart.js/auto';
import { ref, onMounted, onUnmounted, watch } from 'vue';
import type { ChartData } from 'chart.js';

const props = defineProps<{
  data: ChartData<'line'>;
  color: string;
}>();

const canvas = ref(null);
let chart: Chart<'line'> = null;

onMounted(() => {
  const context = canvas.value;
  chart = new Chart<'line'>(context, {
    type: 'line',
    data: props.data,
    options: {
      responsive: true,
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      animation: false,
      borderColor: colors.getPaletteColor(props.color),
      backgroundColor: colors.lighten(colors.getPaletteColor(props.color), 25),
    },
  });
});

onUnmounted(() => chart.destroy());

watch(
  () => props.data,
  (data) => {
    chart.data = data;
    chart.update();
  }
);
</script>
