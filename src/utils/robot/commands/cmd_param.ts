import { Parameter, useRobotParameters } from 'src/stores/robotParameters';
import { useMappingStore, RobotStatus, RegMap } from 'src/stores/MappingData';
import { useRobotQueueStore, Command } from 'src/stores/robotQueue';
import { RobotResponse } from '../types';

import BLE from '../../ble';
import { RobotHandler } from '../handler';

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

export class map_clear extends Command {
  command: string;

  constructor(ram = true) {
    const command = ram ? 'map_clear' : 'map_clearFlash';
    super(command);
    this.command = command;
  }

  async func() {
    try {
      // mappingStore.clearMap();
      await BLE.send(this.command);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async rspInterpreter(response: RobotResponse) {
    if (response.data.match('OK')) console.log('Dados de mapeamento deletados');
    else console.log('Erro ao limpar mapeamento.');
  }
}

export class map_get extends Command {
  command: string;
  constructor(fromRam = false) {
    const command = fromRam ? 'map_getRuntime' : 'map_get';
    super(command);
    this.command = command;
  }

  async func() {
    try {
      await BLE.send(this.command);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async rspInterpreter(response: RobotResponse) {
    console.log('Mapeamento recebido');
    mappingStore.clearMap();
    const Regs: string[] = response.data.split('\n');
    Regs.pop();
    console.log(Regs);
    Regs.forEach((reg) => mappingStore.addReg(reg));
    while (mappingStore.options.length !== 0) mappingStore.options.pop();
    for (let i = 0; i < mappingStore.TotalRegs; i++) mappingStore.options.push(mappingStore.Mapregs.at(i).id);
    console.log(JSON.stringify(mappingStore.Mapregs));
  }
}

export class map_SaveRuntime extends Command {
  constructor() {
    super('map_SaveRuntime');
  }

  async func() {
    try {
      await BLE.send('map_SaveRuntime');
    } catch (error) {
      Promise.reject(error);
    }
  }

  async rspInterpreter(response: RobotResponse) {
    mappingStore.MapSaving = false;
    if (response.data === 'OK') {
      mappingStore.MapStringDialog = 'Mapeamento salvo na flash com sucesso.';
      mappingStore.MapSent = true;
    } else {
      mappingStore.MapStringDialog = 'Falha ao salvar mapeamento na flash.';
      mappingStore.MapSent = true;
    }
  }
}

export class map_add extends Command {
  regMaps: RegMap[];
  actualReg: number;

  constructor(regMaps: RegMap[], actualReg = 0) {
    super('map_add');
    // console.log(JSON.stringify(regMaps));
    this.regMaps = regMaps;
    this.actualReg = actualReg;
    // console.log(JSON.stringify(this.regMaps));
  }

  async func() {
    // console.log(JSON.stringify(this.regMaps));
    // console.log(this.regMaps[this.actualReg].id);
    // console.log(`Enviando mapeamento: ${this.actualReg}`);
    console.log(`map_add ${this.regMaps[this.actualReg].id},${this.regMaps[this.actualReg].Time},${this.regMaps[this.actualReg].EncMedia},${this.regMaps[this.actualReg].EncLeft},${this.regMaps[this.actualReg].EncRight},${this.regMaps[this.actualReg].Status}`);
    await BLE.send(`map_add ${this.regMaps[this.actualReg].id},${this.regMaps[this.actualReg].Time},${this.regMaps[this.actualReg].EncMedia},${this.regMaps[this.actualReg].EncLeft},${this.regMaps[this.actualReg].EncRight},${this.regMaps[this.actualReg].Status}`);
  }

  async rspInterpreter(rsp: RobotResponse) {
    if (rsp.data === 'OK') {

      this.actualReg++;

      if (this.actualReg < this.regMaps.length) {
        RobotHandler.queueCommand(new map_add(this.regMaps, this.actualReg));
      } else {
        mappingStore.MapSending = false;
        mappingStore.MapStringDialog = 'Mapeamento enviado com sucesso.';
        mappingStore.MapSent = true;
        console.log('Mapeamento enviado');
      }

      // if (mappingStore.TotalRegs > mappingStore.getRegToSend + 1) {
      //   mappingStore.resendTries = 3;
      //   let RegsString = '';
      //   while (mappingStore.TotalRegs > mappingStore.getRegToSend + 1) {
      //     if ((RegsString + mappingStore.getRegString(mappingStore.getRegToSend + 1) + ';').length <= 90) {
      //       RegsString += mappingStore.getRegString(mappingStore.getRegToSend + 1) + ';';
      //       mappingStore.setRegToSend(mappingStore.getRegToSend + 1);
      //     } else break;
      //   }
      //   BLE.send(`map_add ${RegsString}`);
      // } else {
      //   console.log('Mapeamento enviado');
      //   mappingStore.MapStringDialog = 'Mapeamento enviado com sucesso.';
      //   mappingStore.MapSending = false;
      //   mappingStore.MapSent = true;
      // }
      // } else if (mappingStore.resendTries > 0) {
      //   mappingStore.resendTries = mappingStore.resendTries - 1;
      //   BLE.send(`map_add ${mappingStore.getRegString(mappingStore.getRegToSend)}`);
      //
    }
    else {
      mappingStore.MapStringDialog = 'Falha ao enviar o mapeamento.';
      mappingStore.MapSent = true;
      mappingStore.MapSending = false;
    }

  }
}
