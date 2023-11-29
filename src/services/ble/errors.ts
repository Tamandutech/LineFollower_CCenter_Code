export class BleError extends Error implements Bluetooth.Error {
  readonly action: string;
  readonly message: string;
  readonly cause: unknown;

  constructor(
    { message, action, cause }: Bluetooth.ErrorOptions,
    ...args: Array<string | undefined>
  ) {
    super(...args);
    this.message = message;
    this.action = action;
    this.cause = cause;
  }
}

export class DeviceNotFoundError extends BleError {
  constructor(
    { message, action, cause }: Partial<Bluetooth.ErrorOptions> = {},
    ...args: Array<string | undefined>
  ) {
    super(
      {
        message: message || 'Robô não encontrado',
        action:
          action || 'Certifique-se de o robô está ligado e aceitando conexões.',
        cause,
      },
      ...args
    );
  }
}

export class DeviceError extends BleError {
  constructor(
    { message, action, cause }: Partial<Bluetooth.ErrorOptions> = {},
    ...args: Array<string | undefined>
  ) {
    super(
      {
        message:
          message ||
          'Ocorreu um erro durante o processamento da mensagem pelo robô',
        action:
          action ||
          'Verifique se o robô está processando os comandos corretamente.',
        cause,
      },
      ...args
    );
  }
}

export class ConnectionError extends BleError {
  constructor(
    { message, action, cause }: Partial<Bluetooth.ErrorOptions> = {},
    ...args: Array<string | undefined>
  ) {
    super(
      {
        message: message || 'Houve um erro durante a conexão com o robô',
        action: action || 'Verifique a conexão com o robô.',
        cause,
      },
      ...args
    );
  }
}

export class CharacteristicWriteError extends BleError {
  constructor(
    { message, action, cause }: Partial<Bluetooth.ErrorOptions> = {},
    ...args: Array<string | undefined>
  ) {
    super(
      {
        message: message || 'Houve um erro durante o envio de dados ao robô',
        action: action || 'Verifique a configuração da conexão com o robô.',
        cause,
      },
      ...args
    );
  }
}
