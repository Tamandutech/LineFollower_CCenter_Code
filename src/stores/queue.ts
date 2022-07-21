/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';

type Job = {
  id: string;
  handler: Function;
};

export const useQueueStore = defineStore('queue', {
  state: () => ({
    pending: [] as Job[],
    completed: [] as Job[],
    active: {} as Job,
  }),

  getters: {
    PENDING(): Job[] {
      return this.pending;
    },

    ACTIVE(): Job {
      return this.active;
    },

    COMPLETED(): Job[] {
      return this.completed;
    },
  },

  actions: {
    addJob(job: Job) {
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
        this.active = {} as Job;
      }
    },

    addPendingJob(job: Job) {
      this.pending.push(job);
    },

    setActiveJob(job: Job) {
      this.active = job;
    },

    popCurrentJob() {
      this.pending.shift();
    },

    addCompletedJob(job: Job) {
      this.completed.push(job);
    },
  },
});
