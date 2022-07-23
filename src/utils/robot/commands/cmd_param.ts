import { Parameter, useRobotParameters } from 'src/stores/robotParameters';
import { useMappingStore, RobotStatus, RegMap } from 'src/stores/MappingData';
import { useRobotQueueStore, Command } from 'src/stores/robotQueue';
import { RobotResponse } from '../types';

import BLE from '../../ble';

const queue = useRobotQueueStore();
const mappingStore = useMappingStore();
const robotParameters = useRobotParameters();

export class param_set extends Command {
  row: Parameter;
  value: undefined;
  initialValue: undefined;

  constructor(row: Parameter, value: undefined, initialValue: undefined) {
    super('param_set');

    this.row = row;
    this.value = value;
    this.initialValue = initialValue;
  }

  async func() {
    if (this.value !== this.initialValue) {
      try {
        await BLE.send('param_set ' + this.row.class.name + '.' + this.row.name + ' ' + this.value);
        // RobotHandler.queueCommand(new param_get(this.row.class.name, this.row.name));
        // await BLE.send('param_get ' + this.row.class.name + '.' + this.row.name);
      } catch (error) {
        Promise.reject(error);
      }
    } else {
      return Promise.resolve();
    }
  }

  async rspInterpreter(rsp: RobotResponse) {
    if (rsp.data.match('OK')) console.log('Parâmetro alterado');
    else console.log('Erro ao alterar parâmetro');
  }
}

export class param_get extends Command {
  className: string;
  paramName: string;

  constructor(className: string, paramName: string) {
    super('param_get');

    this.className = className;
    this.paramName = paramName;
  }

  async func() {
    try {
      await BLE.send('param_get ' + this.className + '.' + this.paramName);
    } catch (error) {
      Promise.reject(error);
    }
  }

  async rspInterpreter(rsp: RobotResponse) {
    console.log('Parâmetro recebido');
    const match = rsp.cmdExecd.match('param_get[ ]+(?<classe>[^.]*).(?<parametro>[^"]*)');
    console.log(match);
    console.log('Classe: ' + match?.groups?.classe + ', Param: ' + match?.groups?.parametro + ', Value: ' + rsp.data);
    if (match?.groups?.classe === undefined || match?.groups?.parametro === undefined) return;
    robotParameters.addParameter(match?.groups?.classe, match?.groups?.parametro, rsp.data);
  }
}

export class param_list extends Command {
  constructor() {
    super('param_list');
  }

  async func() {
    try {
      await BLE.send('param_list');
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async rspInterpreter(rsp: RobotResponse) {
    console.log('Parâmetros recebidos');

    const lines: string[] = rsp.data.split('\n');

    const qtdParams = Number(lines[0].substring(lines[0].indexOf(':') + 2));
    console.log('Qtd de parâmetros: ' + qtdParams);

    for (let index = 0; index < qtdParams; index++) {
      const className: string = lines[index + 1].substring(lines[index + 1].indexOf('-') + 2, lines[index + 1].indexOf('.'));
      const paramName: string = lines[index + 1].substring(lines[index + 1].indexOf('.') + 1, lines[index + 1].indexOf(':'));
      const paramValue: string = lines[index + 1].substring(lines[index + 1].indexOf(':') + 2);

      robotParameters.addParameter(className, paramName, paramValue);

      console.log('ClassName: ' + className + ', ParamName: ' + paramName + ', ParamValue: ' + paramValue);
    }
  }
}


// export default class RobotCommand {
//   static map_get() {
//     queue.addJob({
//       id: 'cmd_param.map_get',
//       caller: 'map_get',
//       handler: async function () {
//         console.log('map_get');
//         await BLE.send('map_get');
//       }.bind(this),
//     });
//   }

//   static map_getRuntime() {
//     queue.addJob({
//       id: 'cmd_param.map_getRuntime',
//       handler: async function () {
//         console.log('map_getRuntime');
//         await BLE.send('map_getRuntime');
//       }.bind(this),
//     });
//   }

//   static map_SaveRuntime() {
//     queue.addJob({
//       id: 'cmd_param.map_SaveRuntime',
//       handler: async function () {
//         console.log('map_SaveRuntime');
//         await BLE.send('map_SaveRuntime');
//       }.bind(this),
//     });
//   }

//   static map_clear() {
//     queue.addJob({
//       id: 'cmd_param.map_clear',
//       handler: async function () {
//         console.log('map_clear');
//         await BLE.send('map_clear');
//       }.bind(this),
//     });
//   }

//   static map_clearFlash() {
//     queue.addJob({
//       id: 'cmd_param.map_clearFlash',
//       handler: async function () {
//         console.log('map_clearFlash');
//         await BLE.send('map_clearFlash');
//       }.bind(this),
//     });
//   }

//   static map_add(regMap: RegMap) {
//     queue.addJob({
//       id: 'cmd_param.map_add',
//       handler: async function () {
//         console.log(`map_add ${regMap.id},${regMap.Time},${regMap.EncMedia},${regMap.EncLeft},${regMap.EncRight},${regMap.Status}`);
//         await BLE.send(`map_add ${regMap.id},${regMap.Time},${regMap.EncMedia},${regMap.EncLeft},${regMap.EncRight},${regMap.Status}`);
//       }.bind(this),
//     });
//   }

//   // TODO

//   // static map_set (){}
//   // static map_clearAtIndex (){}
// }
