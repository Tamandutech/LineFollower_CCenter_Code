/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';

export const useQueueStore = defineStore('queue', {
  state: () => ({
    pending: [] as { id: string; handler: () => void }[],
    completed: [] as { id: string; handler: () => void }[],
    active: {} as { id: string; handler: () => void },
  }),

  getters: {
    PENDING(state) {
      return this.pending;
    },

    ACTIVE(state) {
      return this.active;
    },

    COMPLETED(state) {
      return this.completed;
    },
  },

  actions: {
    addJob(job: { id: string; handler: () => void }) {
      console.log('> addJob', job.id);

      this.$patch(() => {
        this.pending.push(job);
      });

      if (Object.keys(this.active).length == 0) {
        this.startNextJob();
      }
    },

    startNextJob() {
      console.log('> startNextJob');

      if (Object.keys(this.active).length > 0) {
        this.addCompletedJob(this.active);
      }

      if (this.pending.length > 0) {
        this.setActiveJob(this.pending[0]);
        this.popCurrentJob();
      } else {
        this.setActiveJob({ id: '', handler: () => null });
      }
    },

    addPendingJob(job: { id: string; handler: () => void }) {
      this.pending.push(job);
    },

    setActiveJob(job: { id: string; handler: () => void }) {
      this.active = job;
    },

    popCurrentJob() {
      this.pending.shift();
    },

    addCompletedJob(job: { id: string; handler: () => void }) {
      this.completed.push(job);
    },
  },
});
