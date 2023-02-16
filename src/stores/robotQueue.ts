/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';
import { Command } from 'src/utils/robot/commands/cmdParam';

export const useRobotQueue = defineStore('queue', {
  state: () => ({
    _pending: [] as Command[],
    _completed: [] as Command[],
    _failed: [] as Command[],
    _active: null as Command | null,
  }),

  getters: {
    pending: (state): Command[] => state._pending,
    active: (state): Command => state._active,
    completed: (state): Command[] => state._completed,
    failed: (state): Command[] => state._failed,
  },

  actions: {
    addCommand(command: Command) {
      console.log('> addCommand', command.id);

      this.addPendingCommands(command);

      if (!this._active) {
        this.startNextCommand();
      }
    },

    addCommands(commands: Command[]) {
      console.log(
        '> addCommands',
        commands.map((c) => c.id)
      );

      this.addPendingCommands(...commands);

      if (!this._active) {
        this.startNextCommand();
      }
    },

    startNextCommand() {
      console.log('> startNextCommand');

      if (this._active) {
        this.addCompletedCommand(this._active);
      }

      if (this.pending.length > 0) {
        this.setActiveCommand(this.pending[0]);
        this.popCurrentCommand();
      } else {
        this._active = null;
      }
    },

    addPendingCommands(...commands: Command[]) {
      this.$patch(() => {
        this.pending.push(...commands);
      });
    },

    setActiveCommand(command: Command) {
      this.$patch((state) => {
        state._active = command;
      });
    },

    popCurrentCommand() {
      this._pending.shift();
    },

    addCompletedCommand(command: Command) {
      this._completed.push(command);
    },

    addFailedCommand(command: Command) {
      this._failed.push(command);
    },
  },
});
