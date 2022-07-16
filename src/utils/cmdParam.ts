import { Parameter, useRobotParameters } from 'src/stores/robotParameters';
import { useQueueStore } from 'src/stores/queue';

import BLE from './ble';

const queue = useQueueStore();
const robotParameters = useRobotParameters();

export default class CmdParam {
  static updateValue(
    row: Parameter,
    value: undefined,
    initialValue: undefined
  ) {
    queue.addJob({
      id: 'cmdParam.updateValue',
      handler: function () {
        if (value !== initialValue) {
          console.log('updateValue', row, value, initialValue);
          BLE.send(
            'param_set ' + row.class.name + '.' + row.name + ' ' + value
          );
          BLE.send('param_get ' + row.class.name + '.' + row.name);
        }

        queue.startNextJob();
      }.bind(this),
    });
  }

  static param_list() {
    queue.addJob({
      id: 'cmdParam.param_list',
      handler: function () {
        BLE.send('param_list');
        queue.startNextJob();
      }.bind(this),
    });
  }

  static param_get(className: string, paramName: string) {
    queue.addJob({
      id: 'cmdParam.param_get',
      handler: function () {
        console.log('param_get', className, paramName);
        BLE.send('param_get ' + className + '.' + paramName);
        queue.startNextJob();
      }.bind(this),
    });
  }

  static teste() {
    console.log('Adicionando task na fila...');

    queue.addJob({
      id: 'teste',
      handler: function () {
        // Add functionality and data here

        console.log('Executando task...');

        // Complete the job. Can also be called from
        // a promise like when making an API request
        queue.startNextJob();
      }.bind(this),
    });
  }
}

export class CmdParamReader {
  static param_list(data: string) {
    console.log('Parâmetros recebidos');

    const lines: string[] = data.split('\n');

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

  static param_get(data: string) {
    // console.log('Parâmetro recebido');
    //     let match = received.cmdExecd.match(
    //       'param_get[ ]+(?<classe>[^.]*).(?<parametro>[^"]*)'
    //     );
    //     console.log(match);
    //     console.log(
    //       'Classe: ' +
    //         match?.groups?.classe +
    //         ', Param: ' +
    //         match?.groups?.parametro +
    //         ', Value: ' +
    //         received.data
    //     );
    //     if (
    //       match?.groups?.classe === undefined ||
    //       match?.groups?.parametro === undefined
    //     )
    //       return;
    //     this.classes.addParameter(
    //       match?.groups?.classe,
    //       match?.groups?.parametro,
    //       received.data
    //     );
  }
}
