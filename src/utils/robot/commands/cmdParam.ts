import { useRobotParameters } from 'stores/robotParameters';
import { useRobotQueue } from 'stores/robotQueue';
import { useMapping } from 'stores/mapping';
import { useBattery } from 'stores/battery';
import { Task } from 'src/services/queue';

const battery = useBattery();
const commandQueue = useRobotQueue();
const mapping = useMapping();
const robotParameters = useRobotParameters();

export abstract class Command extends Task {
  sanitizeData(data: string): LFCommandCenter.RobotResponse | null {
    console.log(data);

    if (!data.endsWith('\0')) return null;

    return JSON.parse(data.substring(0, data.length - 1));
  }

  characteristicObserver(data: string): Promise<void> | null {
    const result = this.sanitizeData(data);
    if (!result) return null;

    this.resultHandler(result);
    commandQueue.startNextCommand();
  }

  abstract resultHandler(
    data: Record<string, unknown> | string | null
  ): Promise<void>;
}

export class param_set extends Command {
  row: LFCommandCenter.RobotParameter;
  value: undefined;
  initialValue: undefined;

  constructor(
    row: LFCommandCenter.RobotParameter,
    value: undefined,
    initialValue: undefined
  ) {
    super('param_set', { characteristicId: 'UART_TX' });

    this.row = row;
    this.value = value;
    this.initialValue = initialValue;
  }

  async execute() {
    if (this.value === this.initialValue) return;

    try {
      let valueStr ='';
      if(this.value != undefined)
      {
        valueStr = this.value.toString();
        if(this.value < 0)
        {
          valueStr = '!' + valueStr;
        }
      }
      await robotParameters.ble.send(
        this.options.characteristicId.toString(),
        `param_set ${this.row.class.name}.${this.row.name} ${valueStr}`,
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      robotParameters.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    commandQueue.ble.clearData();

    if (response.data.match('OK')) console.log('Parâmetro alterado');
    else console.error('Erro ao alterar parâmetro');
  }
}

export class param_get extends Command {
  className: string;
  paramName: string;

  constructor(className: string, paramName: string) {
    super('param_get', { characteristicId: 'UART_TX' });

    this.className = className;
    this.paramName = paramName;
  }

  async execute() {
    try {
      await robotParameters.ble.send(
        this.options.characteristicId.toString(),
        `param_get ${this.className}.${this.paramName}`,
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      robotParameters.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    robotParameters.ble.clearData();

    const match = response.cmdExecd.match(
      'param_get[ ]+(?<classe>[^.]*).(?<parametro>[^"]*)'
    );
    console.log(match);
    console.log(
      'Classe: ' +
        match?.groups?.classe +
        ', Param: ' +
        match?.groups?.parametro +
        ', Value: ' +
        response.data
    );
    if (
      match?.groups?.classe === undefined ||
      match?.groups?.parametro === undefined
    ) {
      return;
    }
    robotParameters.addParameter(
      match?.groups?.classe,
      match?.groups?.parametro,
      response.data
    );
  }
}

export class param_list extends Command {
  constructor() {
    super('param_list', { characteristicId: 'UART_TX' });
  }

  async execute() {
    try {
      await robotParameters.ble.send(
        this.options.characteristicId.toString(),
        'param_list',
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      robotParameters.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    robotParameters.ble.clearData();
    console.log('Parâmetros recebidos');

    const lines: string[] = response.data.split('\n');

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
        `ClassName: ${className}, ParamName: ${paramName}, ParamValue: ${paramValue}`
      );
    }
  }
}

export class map_clear extends Command {
  command: string;

  constructor(ram = true) {
    const command = ram ? 'map_clear' : 'map_clearFlash';
    super(command, { characteristicId: 'UART_TX' });
    this.command = command;
  }

  async execute() {
    try {
      await mapping.ble.send(
        this.options.characteristicId.toString(),
        this.command,
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      mapping.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    mapping.ble.clearData();

    if (response.data.match('OK')) console.log('Dados de mapeamento deletados');
    else console.log('Erro ao limpar mapeamento.');
  }
}

export class map_get extends Command {
  _command: string;
  constructor(fromRam = false) {
    const command = fromRam ? 'map_getRuntime' : 'map_get';
    super(command, { characteristicId: 'UART_TX' });
    this._command = command;
  }

  async execute() {
    try {
      await mapping.ble.send(
        this.options.characteristicId.toString(),
        this._command,
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      mapping.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      return Promise.reject(error);
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    mapping.ble.clearData();

    mapping.clearMap();

    const regs: string[] = response.data.split('\n');
    regs.pop();

    regs.forEach((reg) => mapping.addReg(reg));

    mapping.options = [];

    mapping.mapRegs.forEach((reg) => mapping.options.push(reg.id));
  }
}

export class map_SaveRuntime extends Command {
  constructor() {
    super('map_SaveRuntime', { characteristicId: 'UART_TX' });
  }

  async execute() {
    try {
      await mapping.ble.send(
        this.options.characteristicId.toString(),
        'map_SaveRuntime',
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      mapping.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      Promise.reject(error);
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    mapping.ble.clearData();

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
    super('map_add', { characteristicId: 'UART_TX' });
    mapping.setRegToSend(actualReg);
    this.regMaps = regMaps;
    this.actualReg = actualReg;
  }

  async execute() {
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
    try {
      await mapping.ble.send(
        this.options.characteristicId.toString(),
        `map_add ${mapping.regsString}`,
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      mapping.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    mapping.ble.clearData();

    if (response.data === 'OK') {
      mapping.regsSent = true;

      if (mapping.totalRegs > mapping.getRegToSend) {
        commandQueue.addCommand(
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
      commandQueue.addCommand(new map_add(this.regMaps, mapping.getRegToSend));
    } else {
      mapping.mapStringDialog = 'Falha ao enviar o mapeamento.';
      mapping.mapSent = true;
      mapping.mapSending = false;
    }
  }
}

export class battery_voltage extends Command {
  constructor() {
    super('battery_voltage', { characteristicId: 'UART_TX' });
  }

  async execute() {
    try {
      await battery.ble.send(
        this.options.characteristicId.toString(),
        'bat_voltage',
        this.characteristicObserver.bind(this),
        this.id
      );
    } catch (error) {
      battery.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  async resultHandler(response: LFCommandCenter.RobotResponse) {
    battery.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    battery.ble.clearData();
    battery.updateVoltage(response.data);
  }
}
