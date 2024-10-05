export class EventEmitter {
  _listeners: Map<string, Array<() => void>>;

  constructor(events: string[]) {
    this._listeners = new Map(events.map((event) => [event, []]));
  }

  emit(event: string): void {
    this._listeners.get(event)?.forEach((listener) => listener());
  }

  listen(event: string, listener: () => void): () => void {
    const index = (this._listeners.get(event)?.push(listener) || 0) - 1;
    return () => this._listeners.get(event)?.splice(index, 1);
  }
}
