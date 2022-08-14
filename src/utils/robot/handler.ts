import { useRobotQueue, Command } from 'src/stores/robotQueue';

const robotQueue = useRobotQueue();

export class RobotHandler {
  static queueCommand(command: Command) {
    robotQueue.addCommand(command);
  }

  static queueCommands(commands: Command[]) {
    robotQueue.addCommands(commands);
  }
}
