<template>
  <div class="q-gutter-md" :class="$attrs.class" v-if="!loading">
    <div
      v-for="[parameter, chartData] in data"
      :key="parameter"
      class="shadow-5 q-pa-sm rounded-borders"
    >
      <StreamChart
        :data="chartData.value"
        :color="
          // @ts-ignore
          streamsLoaded.get(parameter).color
        "
      />
    </div>
  </div>
  <slot :loading="loading" :streams="streamsLoaded"></slot>
</template>

<script setup lang="ts">
import {
  onUnmounted,
  onBeforeMount,
  shallowRef,
  triggerRef,
  computed,
  reactive,
  ref,
} from 'vue';
import { useRobotDataStream } from 'src/composables/stream';
import StreamChart from 'components/StreamChart.vue';
import useBluetooth, { RuntimeError } from 'src/services/ble';
import { randomColorGenerator } from 'src/utils/colors';
import { whenever } from '@vueuse/core';
import type { ComputedRef } from 'vue';
import type { ChartData } from 'chart.js';
import { useErrorCapturing } from 'src/composables/error';

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
  ]),
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
      StreamFullDataCsv: string;
      sum: number;
      stop: () => ReturnType<typeof stopStreamReading>;
    }
  >(),
);
const loading = computed(
  () =>
    streamsLoaded.size == 0 ||
    [...streamsLoaded.values()].some((loaded) => !loaded),
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

    // @ts-ignore
    const TreatedTime = time - parametersFirstTimeValue.get(parameter);
    // @ts-ignore
    streamsValues.get(parameter).value.push([TreatedTime, currentValue]);

    if (!streamsLoaded.has(parameter)) {
      streamsLoaded.set(parameter, {
        color: colors.next().value,
        stop: stopStreamReading.bind(undefined, parameter),
        max: currentValue,
        min: currentValue,
        sum: currentValue,
        receivedValuesCount: 1,
        StreamFullDataCsv:
          'Values;Time\n' +
          currentValue.toString() +
          ';' +
          TreatedTime.toString() +
          '\n',
        get mean() {
          return this.sum / this.receivedValuesCount;
        },
      });
    } else {
      const streamStatus = streamsLoaded.get(parameter);
      if (!streamStatus) {
        return;
      }

      streamStatus.StreamFullDataCsv +=
        currentValue.toString() + ';' + TreatedTime.toString() + '\n';

      if (currentValue > streamStatus.max) {
        streamStatus.max = currentValue;
      } else if (currentValue < streamStatus.min) {
        streamStatus.min = currentValue;
      }

      streamStatus.sum += currentValue;
      streamStatus.receivedValuesCount += 1;
    }

    const streamValueRef = streamsValues.get(parameter);
    if (streamValueRef) {
      triggerRef(streamValueRef);
    }
  });
};
const stopStreamReading = async (parameter: string) => {
  streamsValues.delete(parameter);
  data.delete(parameter);
  await protectedStopStream(parameter);

  streamsLoaded.delete(parameter);
  if (streamsLoaded.size == 0) emit('all-stopped');
};

const data = new Map<string, ComputedRef<ChartData<'line'>>>(
  [...props.parameters.entries()]
    .filter(([, { interval }]) => interval > 0)
    .map(([parameter]) => [
      parameter,
      computed(() => {
        const streamValue = streamsValues.get(parameter);
        const valuesCount = streamValue ? streamValue.value.length : 0;
        let offset = props.parameters.get(parameter)?.range ?? 0;
        if (offset > valuesCount) offset = valuesCount;
        return {
          // @ts-ignore
          labels: streamsValues
            .get(parameter)
            .value.map(([time]) => time)
            .slice(valuesCount - offset),
          datasets: [
            {
              label: parameter,
              // @ts-ignore
              data: streamsValues
                .get(parameter)
                .value.map(([, value]) => value)
                .slice(valuesCount - offset),
            },
          ],
        };
      }),
    ]),
);

const { ble, disconnect: disconnectBluetooth } = useBluetooth();
const error = ref<unknown | null>(null);
const {
  start: startStream,
  stopAll: stopAllStreams,
  stop: stopStream,
} = useRobotDataStream(ble, 'STREAM_TX', 'UART_TX', 'UART_RX', streamReader);
const [protectedStartStream] = useErrorCapturing(
  startStream,
  [RuntimeError],
  error,
  true,
);
const [protectedStopStream] = useErrorCapturing(
  stopStream,
  [RuntimeError],
  error,
);
const [protectedStopAllStreams] = useErrorCapturing(
  stopAllStreams,
  [RuntimeError],
  error,
  true,
);

const gracefullyStopStreams = async () => {
  try {
    await protectedStopAllStreams();
  } catch {
    disconnectBluetooth();
  }
};

whenever(error, () => emit('error', error.value));

onBeforeMount(async () => {
  try {
    for (const [parameter, { interval }] of props.parameters.entries()) {
      if (interval > 0) {
        await protectedStartStream(parameter, interval * 1000);
      }
    }
  } catch {
    await gracefullyStopStreams();
  }
});

onUnmounted(gracefullyStopStreams);
</script>
