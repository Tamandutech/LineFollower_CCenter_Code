<template>
  <q-card>
    <q-card-section>
      <div class="row justify-between">
        <div class="col-auto">
          <code class="text-h5 block">{{ robotName }} Bash</code>
          <p class="text-subtitle2 text-grey-7">Seguidor de linha</p>
        </div>
      </div>
    </q-card-section>
    <q-separator inset />
    <q-card-section>
      <q-input
        standout
        v-model="command"
        :dense="dense"
        prefix="$"
        @keyup.enter="sendCommand"
      >
        <template v-slot:append>
          <q-avatar>
            <img src="~/assets/icons/quasar.svg" />
          </q-avatar>
        </template>
        <template v-slot:hint>Digite o comando...</template>
      </q-input>
    </q-card-section>
  </q-card>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import ws from 'src/ws';

export default defineComponent({
  name: 'LineFollowerCli',
  props: { robotName: { type: String, required: true } },
  setup() {
    const command = ref('');
    const dense = ref(false);

    function sendCommand() {
      ws.send(command.value);
    }

    return {
      command,
      dense,
      sendCommand,
    };
  },
});
</script>
