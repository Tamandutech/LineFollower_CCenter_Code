<template>
  <q-btn color="secondary" round :icon="mdiBluetoothConnect" :loading="loading">
    <template v-slot:loading>
      <q-spinner-radio class="on-center" />
    </template>
    <q-menu>
      <q-list>
        <q-item
          v-for="robot of robots"
          :key="robot.name"
          clickable
          @click="performConnect(robot)"
          v-close-popup
        >
          <q-item-section avatar>
            <q-avatar :icon="mdiRobotMowerOutline"></q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ robot.name }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getDocs, query, collection } from 'firebase/firestore';
import {
  mdiBluetoothConnect,
  mdiRobotMowerOutline,
} from '@quasar/extras/mdi-v6';
import { useSessionStore } from 'src/stores/session';
import useFirebase from 'src/services/firebase';
import useBluetooth, { BleError, ConnectionError } from 'src/services/ble';
import { useLoading } from 'src/composables/loading';
import { useRetry } from 'src/composables/retry';

const emit = defineEmits<{
  (e: 'bluetooth-connection-error', message: string): void;
  (e: 'connect', robot: Robot.BluetoothConnectionConfig): void;
}>();

const { connect: _connect, requestDevice } = useBluetooth();
const session = useSessionStore();
const [connect] = useRetry(_connect, [ConnectionError, BleError], {
  maxRetries: 3,
  delay: 1000,
});
const [performConnect, loading] = useLoading(async function (
  config: Robot.BluetoothConnectionConfig
) {
  try {
    const device = await requestDevice(Object.keys(config.services));
    await connect(device, config);
    session.robot = config;
    emit('connect', config);
  } catch (error) {
    emit(
      'bluetooth-connection-error',
      error instanceof ConnectionError
        ? error.message
        : 'Ocorreu um erro durante a conexão com o robô. Tente novamente.'
    );
  }
});

const robots = ref<Robot.BluetoothConnectionConfig[]>([]);
onMounted(async () => {
  const { db } = useFirebase();
  robots.value = (await getDocs(query(collection(db, 'robots')))).docs.map(
    (doc) => ({ id: doc.id, ...doc.data() })
  ) as Robot.BluetoothConnectionConfig[];
});
</script>
