import { useRobotParameters } from 'stores/robotParameters';
import { useMapping } from 'stores/mapping';
import { useBattery } from 'stores/battery';
import { Command } from 'stores/robotQueue';

import BLE from 'src/utils/ble';
import { RobotHandler } from 'src/utils/robot/handler';

const battery = useBattery();
const mapping = useMapping();
const robotParameters = useRobotParameters();

export class param_set extends Command {
  row: LFCommandCenter.RobotParameter;
  value: undefined;
  initialValue: undefined;

  constructor(
    row: LFCommandCenter.RobotParameter,
    value: undefined,
    initialValue: undefined
  ) {
    super('param_set');

    this.row = row;
    this.value = value;
    this.initialValue = initialValue;
  }

  async func() {
    if (this.value !== this.initialValue) {
      try {
        await BLE.send(
          'param_set ' +
            this.row.class.name +
            '.' +
            this.row.name +
            ' ' +
            this.value
        );
      } catch (error) {
        Promise.reject(error);
      }
    } else {
      return Promise.resolve();
    }
  }

  async rspInterpreter(rsp: LFCommandCenter.RobotResponse) {
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

  async rspInterpreter(rsp: LFCommandCenter.RobotResponse) {
    console.log('Parâmetro recebido');
    const match = rsp.cmdExecd.match(
      'param_get[ ]+(?<classe>[^.]*).(?<parametro>[^"]*)'
    );
    console.log(match);
    console.log(
      'Classe: ' +
        match?.groups?.classe +
        ', Param: ' +
        match?.groups?.parametro +
        ', Value: ' +
        rsp.data
    );
    if (
      match?.groups?.classe === undefined ||
      match?.groups?.parametro === undefined
    )
      return;
    robotParameters.addParameter(
      match?.groups?.classe,
      match?.groups?.parametro,
      rsp.data
    );
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

  async rspInterpreter(rsp: LFCommandCenter.RobotResponse) {
    console.log('Parâmetros recebidos');

    const lines: string[] = rsp.data.split('\n');

    const qtdParams = Number(lines[0].substring(lines[0].indexOf(':') + 2));
    console.log('Qtd de parâmetros: ' + qtdParams);

    for (let index = 0; index < qtdParams; index++) {
      const className: string = lines[index + 1].substring(
        lines[index + 1].indexOf('-') + 2,
        lines[index + 1].indexOf('.')
      );
      const paramName: string = lines[index + 1].substring(
        lines[index + 1].indexOf('.') + 1,
        lines[index + 1].indexOf(':')
      );
      const paramValue: string = lines[index + 1].substring(
        lines[index + 1].indexOf(':') + 2
      );

      robotParameters.addParameter(className, paramName, paramValue);

      console.log(
        'ClassName: ' +
          className +
          ', ParamName: ' +
          paramName +
          ', ParamValue: ' +
          paramValue
      );
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

  async rspInterpreter(response: LFCommandCenter.RobotResponse) {
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

  async rspInterpreter(response: LFCommandCenter.RobotResponse) {
    console.log('Mapeamento recebido');
    mapping.clearMap();
    const Regs: string[] = response.data.split('\n');
    Regs.pop();
    console.log(Regs);
    Regs.forEach((reg) => mapping.addReg(reg));
    while (mapping.options.length !== 0) mapping.options.pop();
    for (let i = 0; i < mapping.totalRegs; i++)
      mapping.options.push(mapping.mapRegs.at(i).id);
    console.log(JSON.stringify(mapping.mapRegs));
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

  async rspInterpreter(response: LFCommandCenter.RobotResponse) {
    mapping.mapSaving = false;
    if (response.data === 'OK') {
      mapping.mapStringDialog = 'Mapeamento salvo na flash com sucesso.';
      mapping.mapSent = true;
    } else {
      mapping.mapStringDialog = 'Falha ao salvar mapeamento na flash.';
      mapping.mapSent = true;
    }
  }
}

export class map_add extends Command {
  regMaps: LFCommandCenter.RegMap[];
  actualReg: number;

  constructor(regMaps: LFCommandCenter.RegMap[], actualReg = 0) {
    super('map_add');
    // console.log(JSON.stringify(regMaps));
    mapping.setRegToSend(actualReg);
    this.regMaps = regMaps;
    this.actualReg = actualReg;
    // console.log(JSON.stringify(this.regMaps));
  }

  async func() {
    if (mapping.regsSent) {
      mapping.regsString = '';
      while (mapping.totalRegs > mapping.getRegToSend) {
        if (
          (
            mapping.regsString +
            mapping.getRegString(mapping.getRegToSend) +
            ';'
          ).length <= 90
        ) {
          mapping.regsString +=
            mapping.getRegString(mapping.getRegToSend) + ';';
          mapping.setRegToSend(mapping.getRegToSend + 1);
        } else break;
      }
    }
    await BLE.send(`map_add ${mapping.regsString}`);
  }

  async rspInterpreter(rsp: LFCommandCenter.RobotResponse) {
    if (rsp.data === 'OK') {
      mapping.regsSent = true;
      if (mapping.totalRegs > mapping.getRegToSend) {
        RobotHandler.queueCommand(
          new map_add(this.regMaps, mapping.getRegToSend)
        );
      } else {
        mapping.mapSending = false;
        mapping.mapStringDialog = 'Mapeamento enviado com sucesso.';
        mapping.mapSent = true;
        console.log('Mapeamento enviado');
      }
    } else if (mapping.resendTries > 0) {
      mapping.resendTries = mapping.resendTries - 1;
      mapping.regsSent = false;
      RobotHandler.queueCommand(
        new map_add(this.regMaps, mapping.getRegToSend)
      );
    } else {
      mapping.mapStringDialog = 'Falha ao enviar o mapeamento.';
      mapping.mapSent = true;
      mapping.mapSending = false;
    }
  }
}

export class battery_voltage extends Command {
  constructor() {
    super('battery_voltage');
  }

  async func() {
    await BLE.send('bat_voltage');
  }

  async rspInterpreter(rsp: LFCommandCenter.RobotResponse) {
    battery.updateVoltage(rsp.data);
  }
}
