<template>
  <q-dialog
    v-model="messageState.showMessageFeedback"
    seamless
    square
    auto-close
    no-focus
    position="right"
    transition-show="jump-left"
    transition-hide="fade"
  >
    <q-card
      :class="messageState.feedbackDialogBg"
      class="relative-position fixed-top-right q-mr-md q-mt-xl"
    >
      <q-card-section class="text-grey-1 no-wrap row no-wrap">
        <q-spinner
          color="grey-1"
          size="2em"
          :class="{ hidden: !messageState.waitingResponse }"
        ></q-spinner>
        <p class="text-h6 q-pl-md q-mb-none">opa</p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useMessage } from 'stores/message';

export default defineComponent({
  name: 'MessageFeedbackDialog',
  setup() {
    const messageState = useMessage();

    onMounted(() =>
      messageState.socket.addEventListener(
        'message',
        messageState.setResultFeedback
      )
    );

    return { messageState };
  },
});
</script>
