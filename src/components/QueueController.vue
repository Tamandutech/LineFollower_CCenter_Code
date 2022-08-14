<script lang="ts">
import { defineComponent } from 'vue';
import { mapState } from 'pinia';
import { useRobotQueueStore } from 'src/stores/robotQueue';

export default defineComponent({
  name: 'QueueController',

  mounted() {
    console.log('> QueueController montado...');
  },

  computed: {
    ...mapState(useRobotQueueStore, {
      pending: 'pending',
      active: 'active',
      completed: 'completed',
    }),
  },

  watch: {
    active() {
      this.processCommand();
    },
  },

  methods: {
    async processCommand() {
      if (this.active && this.active.id) {
      console.log('> processando Command: ' + this.active.id);
        try {
          await this.active.execute();

        } catch (e) {
          console.error(e);
        } finally {
          // useRobotQueueStore().startNextCommand();
        }

        // useRobotQueueStore().startNextCommand();
      }
    },
  },
});
</script>
