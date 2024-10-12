export class ObservableCharacteristic {
  _characteristic: BluetoothRemoteGATTCharacteristic;
  _messages: Bluetooth.Message[] = [];
  _observers = new Map<string, unknown>();
  _cache = '';
  _decoder = new TextDecoder();

  constructor(characteristic: BluetoothRemoteGATTCharacteristic) {
    this._characteristic = characteristic;

    this._characteristic.addEventListener(
      'characteristicvaluechanged',
      this._handleChunck.bind(this),
    );
  }

  _handleChunck() {
    const data = this._decoder.decode(
      new Uint8Array(this._characteristic.value?.buffer || new ArrayBuffer(0)),
    );
    if (data.indexOf('\0') === -1) {
      return this._cacheData(data);
    }

    this._cacheData(data.split('\0').at(0) || '');
    this._pushMessage();
    this._cacheData(data.slice(data.indexOf('\0') + 1));

    return this._notify();
  }

  _cacheData(data: string): void {
    this._cache += data;
  }

  _pushMessage(): void {
    this._messages.push(JSON.parse(this._cache));
    this._cache = '';
  }

  _notify(): void {
    let message: Bluetooth.Message | undefined;

    while ((message = this._messages.shift())) {
      for (const [, observer] of this._observers) {
        if (observer instanceof Function) {
          observer(message);
        }
      }
    }
  }

  subscribe(observer: unknown, uuid: string): void {
    this._observers.set(uuid, observer);
  }

  unsubscribe(uuid: string): boolean {
    return this._observers.delete(uuid);
  }
}
