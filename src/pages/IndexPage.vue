<template>
  <q-page class="q-pa-md">
    <line-follower-cli robotName="Braia" />
    <message-feedback-dialog></message-feedback-dialog>
  </q-page>
</template>

<script lang="ts">
import LineFollowerCli from 'components/LineFollowerCli.vue';
import MessageFeedbackDialog from 'components/MessageFeedbackDialog.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
  components: { LineFollowerCli, MessageFeedbackDialog },
});
</script>
