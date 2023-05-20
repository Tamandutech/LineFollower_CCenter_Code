<template>
  <q-btn
    color="secondary"
    round
    :icon="mdiBluetoothConnect"
    :loading="loading === performConnect.name"
  >
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
import useBluetooth, { BleError } from 'src/services/ble';
import { useLoading } from 'src/composables/loading';

const emit = defineEmits<{
  (e: 'bluetooth-connection-error', message: string): void;
  (e: 'connect', robot: Robot.BluetoothConnectionConfig): void;
}>();

const session = useSessionStore();
const { connect } = useBluetooth();
const { loading, notifyLoading } = useLoading();
const performConnect = notifyLoading(async function (
  config: Robot.BluetoothConnectionConfig
) {
  try {
    await connect(config);
    session.robot = config;
    emit('connect', config);
  } catch (error) {
    emit(
      'bluetooth-connection-error',
      error instanceof BleError
        ? error.message
        : 'Ocorreu um erro durante a conexão com o robô. Tente novamente.'
    );
  }
},
'performConnect');

const robots = ref<Robot.BluetoothConnectionConfig[]>([]);
onMounted(async () => {
  const { db } = useFirebase();
  robots.value = (await getDocs(query(collection(db, 'robots')))).docs.map(
    (doc) => ({ id: doc.id, ...doc.data() })
  ) as Robot.BluetoothConnectionConfig[];
});
</script>
