import { useRobotParameters } from 'stores/robotParameters';
import { useRobotQueue } from 'stores/robotQueue';
import { useMapping } from 'stores/mapping';
import { useBattery } from 'stores/battery';
import { v4 as uuidv4 } from 'uuid';

const battery = useBattery();
const commandQueue = useRobotQueue();
const mapping = useMapping();
const robotParameters = useRobotParameters();

export abstract class Command {
  _id: string;
  _name: string;
  _options: Record<string, string | number>;
  _error: string | null;

  constructor(name: string, options: Record<string, string | number> = null) {
    this._name = name;
    this._id = uuidv4();
    if (options) {
      this._options = options;
    }
  }

  get name() {
    return this._name;
  }

  get id() {
    return this._id;
  }

  get options() {
    return this._options;
  }

  get error() {
    return this._error;
  }

  set error(value: unknown) {
    if (value instanceof Error) {
      this._error = value.message;
    } else if (typeof value === 'string') {
      this._error = value;
    } else {
      this._error = value.toString();
    }
  }

  abstract execute(): Promise<void>;

  characteristicObserver(response: Robot.Response<string>): void {
    if (!response.cmdExecd.startsWith(this.name)) {
      return;
    }
    return this.resultHandler(response);
  }

  abstract resultHandler(data: Record<string, unknown> | string | null): void;
}

export class param_set extends Command {
  row: Robot.Parameter;
  value: unknown;
  initialValue: unknown;

  constructor(row: Robot.Parameter, value: unknown, initialValue: unknown) {
    super('param_set', { characteristicId: 'UART_TX' });

    this.row = row;
    this.value = value;
    this.initialValue = initialValue;
  }

  async execute() {
    if (this.value === this.initialValue) return;

    try {
      let valueStr = '';
      if (this.value !== undefined) {
        valueStr = this.value.toString();

        if (Number(this.value) < 0) {
          valueStr = '!' + valueStr;
        }
      }

      await robotParameters.ble.send(
        'UART_RX',
        `param_set ${this.row.class.name}.${this.row.name} ${valueStr}`
      );

      robotParameters.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

    if (response.data.toString().match('OK')) console.log('Parâmetro alterado');
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
        'UART_RX',
        `param_get ${this.className}.${this.paramName}`
      );

      robotParameters.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

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
    robotParameters.ble.addTxObserver(
      this.options.characteristicId.toString(),
      this.characteristicObserver.bind(this),
      this.id
    );

    try {
      await robotParameters.ble.send('UART_RX', 'param_list');
    } catch (error) {
      robotParameters.ble.removeTxObserver(
        this.id,
        this.options.characteristicId.toString()
      );
      this.error = error;
    }
  }

  resultHandler(response: Robot.Response<string>) {
    robotParameters.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    console.log('Parâmetros recebidos');

    const lines: string[] = response.data.toString().split('\n');

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
      await mapping.ble.send('UART_RX', this.command);

      mapping.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

    if (response.data.toString().match('OK'))
      console.log('Dados de mapeamento deletados');
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
      await mapping.ble.send('UART_RX', this._command);

      mapping.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

    mapping.clearMap();

    const regs: string[] = response.data.toString().split('\n');
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
      await mapping.ble.send('UART_RX', 'map_SaveRuntime');

      mapping.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

    mapping.mapSaving = false;
    if (response.data.toString() === 'OK') {
      mapping.mapStringDialog = 'Mapeamento salvo na flash com sucesso.';
      mapping.mapSent = true;
    } else {
      mapping.mapStringDialog = 'Falha ao salvar mapeamento na flash.';
      mapping.mapSent = true;
    }
  }
}

export class map_add extends Command {
  regMaps: Robot.RegMap[];
  actualReg: number;

  constructor(regMaps: Robot.RegMap[], actualReg = 0) {
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
      await mapping.ble.send('UART_RX', `map_add ${mapping.regsString}`);

      mapping.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  resultHandler(response: Robot.Response<string>) {
    mapping.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );

    if (response.data.toString() === 'OK') {
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

export class bat_voltage extends Command {
  constructor() {
    super('bat_voltage', { characteristicId: 'UART_TX' });
  }

  async execute() {
    try {
      await battery.ble.send('UART_RX', 'bat_voltage');

      battery.ble.addTxObserver(
        this.options.characteristicId.toString(),
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

  async resultHandler(response: Robot.Response<string>) {
    battery.ble.removeTxObserver(
      this.id,
      this.options.characteristicId.toString()
    );
    battery.updateVoltage(response.data.toString());
  }
}
