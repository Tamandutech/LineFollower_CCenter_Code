<template>
  <q-page class="q-pa-md">
    <line-follower-cli robotName="Braia" />
    <message-feedback-dialog></message-feedback-dialog>
  </q-page>
</template>

<script lang="ts">
<<<<<<< HEAD
import LineFollowerCli from 'components/LineFollowerCli.vue';
import MessageFeedbackDialog from 'components/MessageFeedbackDialog.vue';
=======
>>>>>>> 543f479f4d5de1df31da3ba8c1e7f2ba84cbfce7
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'IndexPage',
<<<<<<< HEAD
  components: { LineFollowerCli, MessageFeedbackDialog },
=======
  components: {},
>>>>>>> 543f479f4d5de1df31da3ba8c1e7f2ba84cbfce7
});
</script>
