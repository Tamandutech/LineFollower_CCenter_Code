// import { RobotCommandReader } from './cmd_param';
// import { RobotResponse } from './types';
import { useRobotQueueStore, Command } from 'src/stores/robotQueue';

// const RobotCommandsMap = new Map<string, (data: RobotResponse) => void>([
//   ['param_list', RobotCommandReader.param_list],
//   ['param_get', RobotCommandReader.param_get],
//   ['param_set', RobotCommandReader.param_set],
// ]);

const robotQueueStore = useRobotQueueStore();

export class RobotHandler {
  static queueCommand(command: Command) {
    robotQueueStore.addCommand(command);
  }

  static queueCommands(commands: Command[]) {
    robotQueueStore.addCommands(commands);
  }
}
