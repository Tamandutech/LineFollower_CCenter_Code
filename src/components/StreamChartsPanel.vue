<template>
  <div class="q-gutter-md" :class="$attrs.class" v-if="!loading">
    <div
      v-for="[parameter, chartData] in data"
      :key="parameter"
      class="shadow-5 q-pa-sm rounded-borders"
    >
      <StreamChart
        :data="chartData.value"
        :color="streamsLoaded.get(parameter).color"
      />
    </div>
  </div>
  <slot :loading="loading" :streams="streamsLoaded"></slot>
</template>

<script setup lang="ts">
import {
  onUnmounted,
  watchEffect,
  onBeforeMount,
  shallowRef,
  triggerRef,
  computed,
  reactive,
} from 'vue';
import type { ComputedRef } from 'vue';
import type { ChartData } from 'chart.js';
import useRobotDataStream from 'src/composables/useRobotDataStream';
import StreamChart from 'components/StreamChart.vue';
import useBluetooth from 'src/services/ble';
import { randomColorGenerator } from 'src/utils/colors';

const props = defineProps<{
  parameters: Map<string, { interval: number; range: number }>;
}>();
const emit = defineEmits<{
  (event: 'error', error: unknown): void;
  (event: 'all-stopped'): void;
}>();

const colors = randomColorGenerator();
const streamsValues = new Map(
  [...props.parameters.keys()].map((parameter) => [
    parameter,
    shallowRef<[number, number][]>([]),
  ])
);
const streamsLoaded = reactive(
  new Map<
    string,
    {
      color: string;
      max: number;
      min: number;
      mean: number;
      receivedValuesCount: number;
      sum: number;
      stop: () => ReturnType<typeof stopStreamReading>;
    }
  >()
);
const loading = computed(
  () =>
    streamsLoaded.size == 0 ||
    [...streamsLoaded.values()].some((loaded) => !loaded)
);
const parametersFirstTimeValue = new Map<string, number>();
const streamReader = (currentValues: Robot.RuntimeStream[]) => {
  currentValues.forEach(({ name: parameter, value, Time }) => {
    const time = Number(Time);
    const currentValue = Number(value);

    if (!parametersFirstTimeValue.has(parameter)) {
      parametersFirstTimeValue.set(parameter, time);
    }

    if (!streamsValues.has(parameter)) return;

    streamsValues
      .get(parameter)
      .value.push([
        time - parametersFirstTimeValue.get(parameter),
        currentValue,
      ]);
    if (
      streamsValues.get(parameter).value.length <=
      props.parameters.get(parameter).range
    ) {
      return;
    }

    streamsValues.get(parameter).value.shift();

    if (!streamsLoaded.has(parameter)) {
      streamsLoaded.set(parameter, {
        color: colors.next().value,
        stop: stopStreamReading.bind(undefined, parameter),
        max: currentValue,
        min: currentValue,
        sum: currentValue,
        receivedValuesCount: 1,
        get mean() {
          return this.sum / this.receivedValuesCount;
        },
      });
    } else {
      const streamStatus = streamsLoaded.get(parameter);

      if (currentValue > streamStatus.max) {
        streamStatus.max = currentValue;
      } else if (currentValue < streamStatus.min) {
        streamStatus.min = currentValue;
      }

      streamStatus.sum += currentValue;
      streamStatus.receivedValuesCount += 1;
    }

    triggerRef(streamsValues.get(parameter));
  });
};
const stopStreamReading = async (parameter: string) => {
  streamsValues.delete(parameter);
  data.delete(parameter);
  await stopStream(parameter);

  streamsLoaded.delete(parameter);
  if (streamsLoaded.size == 0) emit('all-stopped');
};

const data = new Map<string, ComputedRef<ChartData<'line'>>>(
  [...props.parameters.entries()]
    .filter(([, { interval }]) => interval > 0)
    .map(([parameter]) => [
      parameter,
      computed(() => ({
        labels: streamsValues.get(parameter).value.map(([time]) => time),
        datasets: [
          {
            label: parameter,
            data: streamsValues
              .get(parameter)
              .value.map(
                ([, value]) => (value + Math.random()) * (Math.random() * 3)
              ),
          },
        ],
      })),
    ])
);

const { ble, disconnect: disconnectBluetooth } = useBluetooth();
const {
  start: startStream,
  stopAll: stopAllStreams,
  stop: stopStream,
  error,
} = useRobotDataStream(ble, 'STREAM_TX', 'UART_TX', 'UART_RX', streamReader);

const gracefullyStopStreams = async () => {
  try {
    await stopAllStreams();
  } catch (error) {
    emit('error', error);
    disconnectBluetooth();
  }
};

watchEffect(() => {
  if (error.value) emit('error', error.value);
});

onBeforeMount(async () => {
  try {
    for (const [parameter, { interval }] of props.parameters.entries()) {
      if (interval > 0) {
        await startStream(parameter, interval * 1000);
      }
    }
  } catch (error) {
    emit('error', error);
    await gracefullyStopStreams();
  }
});

onUnmounted(gracefullyStopStreams);
</script>
