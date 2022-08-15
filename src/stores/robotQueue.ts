/* eslint-disable @typescript-eslint/ban-types */
import { defineStore } from 'pinia';

export abstract class Command {
  id: number;
  cmdName: string;

  constructor(cmdName: string) {
    this.cmdName = cmdName;
    this.id = Math.floor(Math.random() * 1000);
  }

  abstract func(): Promise<void>;
  abstract rspInterpreter(rsp: LFCommandCenter.RobotResponse): Promise<void>;

  async execute() {
    this.func().catch((error) => {
      console.error(error);
      useRobotQueue().startNextCommand();
    });
  }

  async setResponse(rsp: LFCommandCenter.RobotResponse) {
    await this.rspInterpreter(rsp);
    useRobotQueue().startNextCommand();
  }
}

export const useRobotQueue = defineStore('queue', {
  state: () => ({
    pending: [] as Command[],
    completed: [] as Command[],
    active: {} as Command,
  }),

  getters: {
    PENDING(): Command[] {
      return this.pending;
    },

    ACTIVE(): Command {
      return this.active;
    },

    COMPLETED(): Command[] {
      return this.completed;
    },
  },

  actions: {
    addCommand(Command: Command) {
      console.log('> addCommand', Command.id);

      this.$patch(() => {
        this.pending.push(Command);
      });

      if (Object.keys(this.active).length == 0) {
        this.startNextCommand();
      }
    },

    addCommands(Commands: Command[]) {
      console.log(
        '> addCommands',
        Commands.map((c) => c.id)
      );

      this.$patch(() => {
        this.pending.push(...Commands);
      });

      if (Object.keys(this.active).length == 0) {
        this.startNextCommand();
      }
    },

    startNextCommand() {
      console.log('> startNextCommand');

      if (Object.keys(this.active).length > 0) {
        this.addCompletedCommand(this.active);
      }

      if (this.pending.length > 0) {
        this.setActiveCommand(this.pending[0]);
        this.popCurrentCommand();
      } else {
        this.active = {} as Command;
      }
    },

    addPendingCommand(Command: Command) {
      this.pending.push(Command);
    },

    setActiveCommand(Command: Command) {
      this.active = Command;
    },

    popCurrentCommand() {
      this.pending.shift();
    },

    addCompletedCommand(Command: Command) {
      this.completed.push(Command);
    },
  },
});
