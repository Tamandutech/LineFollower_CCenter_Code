<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useQueueStore } from 'src/stores/queue';

export default defineComponent({
  name: 'QueueController',

  mounted() {
    console.log('> QueueController montado...');
  },

  computed: {
    ...mapState(useQueueStore, {
      pending: 'pending',
      active: 'active',
      completed: 'completed',
    }),
  },

  watch: {
    active() {
      console.log('> active');
      this.processJob();
    },
  },

  methods: {
    processJob() {
      console.log('> processJob: ' + this.active.id);
      if (this.active.handler != null) {
        this.active.handler();
      }
    },
  },
});
</script>
