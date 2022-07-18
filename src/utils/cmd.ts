import { CmdParamReader } from './cmdParam';

const cmdHandlerMap = new Map<
  string,
  (data: { cmdExecd: string; data: string }) => void
>([
  ['param_list', CmdParamReader.param_list],
  ['param_get', CmdParamReader.param_get],
  ['param_set', CmdParamReader.param_set],
]);

export { cmdHandlerMap };
