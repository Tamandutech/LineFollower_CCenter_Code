import { useRobotQueue, Command } from 'src/stores/robotQueue';

const robotQueueStore = useRobotQueue();

export class RobotHandler {
  static queueCommand(command: Command) {
    robotQueueStore.addCommand(command);
  }

  static queueCommands(commands: Command[]) {
    robotQueueStore.addCommands(commands);
  }
}
