import { RobotCommandReader } from './cmd_param';
import { RobotResponse } from './types';

const RobotCommandsMap = new Map<string, (data: RobotResponse) => void>([
  ['param_list', RobotCommandReader.param_list],
  ['param_get', RobotCommandReader.param_get],
  ['param_set', RobotCommandReader.param_set],
]);

export { RobotCommandsMap };
