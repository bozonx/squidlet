import {isPromise} from './common';

export type DefaultHandler = (...args: any[]) => void;


export default class IndexedEventEmitter<T extends DefaultHandler = DefaultHandler> {
  // all the handlers by index, removed handlers are empty
  private handlers: (T | undefined)[] = [];
  // indexes by event names
  private indexes: {[index: string]: number[]} = {};

  // TODO: test
  get isDestroyed(): boolean {
    return typeof this.handlers === 'undefined' && typeof this.indexes === 'undefined';
  }


  emit = (eventName: string | number, ...args: any[]) => {
    if (!this.indexes[eventName]) return;

    // make clone of indexes because some indexes are able be removed while processing "once" events
    const indexes: number[] = [ ...this.indexes[eventName] ];

    for (let index of indexes) {
      const handler: T | undefined = this.handlers[index];

      // TODO: test
      if (!handler) {
        throw new Error(
          `IndexedEventEmitter.emit: can't find handler of event "${eventName}" by index "${index}"`
        );
      }

      handler(...args);
    }
  }

  emitSync = async (eventName: string | number, ...args: any[]): Promise<void> => {
    if (!this.indexes[eventName]) return;

    // make clone of indexes because some indexes are able be removed while processing "once" events
    const indexes: number[] = [ ...this.indexes[eventName] ];

    for (let index of indexes) {
      const handler: T | undefined = this.handlers[index];

      // TODO: test
      if (!handler) {
        throw new Error(
          `IndexedEventEmitter.emitSync: can't find handler of event "${eventName}" by index "${index}"`
        );
      }

      await handler(...args);
    }
  }

  // TODO: можно сделать вариант когда выполняются все, ошибочные пропускаются и выводятся ошибки списокм

  // TODO: test
  // TODO: review
  emitAll = async (eventName: string | number, ...args: any[]): Promise<void> => {
    if (!this.indexes[eventName]) return;

    const promises: Promise<any>[] = [];


    // TODO: не будет рабоать ?????
    // TODO: делать клон индексов

    for (let index of this.indexes[eventName]) {
      const handler: T | undefined = this.handlers[index];

      // TODO: test
      if (!handler) {
        throw new Error(
          `IndexedEventEmitter.emitAll: can't find handler of event "${eventName}" by index "${index}"`
        );
      }

      const result: any = handler(...args);

      if (isPromise(result)) {
        promises.push(result);
      }
    }

    await Promise.all(promises);
  }

  once(eventName: string | number, handler: T): number {
    let wrapperIndex: number;
    const wrapper = ((...args: any[]) => {
      this.removeListener(wrapperIndex, eventName);
      // return in promise case
      // TODO: что если произойдет ошибка ???
      return handler(...args);
    }) as T;

    wrapperIndex = this.addListener(eventName, wrapper);

    return wrapperIndex;
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string | number, handler: T): number {
    if (!this.indexes[eventName]) {
      this.indexes[eventName] = [];
    }

    const index: number = this.handlers.length;

    this.handlers.push(handler);

    this.indexes[eventName].push(index);

    return index;
  }

  getListeners(eventName: string | number): T[] {
    if (!this.indexes[eventName]) return [];

    const result: T[] = [];

    for (let index of this.indexes[eventName]) {
      const handler: T | undefined = this.handlers[index];

      // TODO: test
      if (!handler) {
        throw new Error(
          `IndexedEventEmitter.getListeners: can't find handler of event "${eventName}" by index "${index}"`
        );
      }

      result.push(handler);
    }

    return result;
  }

  hasListeners(eventName: string | number): boolean {
    return Boolean(this.indexes[eventName] && this.indexes[eventName].length);
  }

  /**
   * Remove handler by index.
   * You can omit eventName, but if you defined it then removing will be faster.
   */
  removeListener(handlerIndex: number, eventName?: string | number): void {
    if (typeof eventName !== 'undefined') {
      if (!this.indexes[eventName]) return;

      // find index of handler index in list belongs to eventName
      const foundIndexInEvents: number = this.indexes[eventName].findIndex((item) => item === handlerIndex);

      if (foundIndexInEvents < 0) return;

      this.indexes[eventName].splice(foundIndexInEvents, 1);

      // remove event's array if it is empty
      if (!this.indexes[eventName].length) {
        delete this.indexes[eventName];
      }

      delete this.handlers[handlerIndex];

      return;
    }

    // find the event name and remove it's index.
    for (let eventName of Object.keys(this.indexes)) {
      const found: number | undefined = this.indexes[eventName].find((item) => item === handlerIndex);

      if (typeof found === 'undefined') continue;

      // found

      this.indexes[eventName].splice(handlerIndex, 1);

      if (!this.indexes[eventName].length) delete this.indexes[eventName];

      delete this.handlers[handlerIndex];

      return;
    }
  }

  removeAllListeners(eventName: string | number): void {
    if (!this.indexes[eventName]) return;

    for (let index of this.indexes[eventName]) {
      delete this.handlers[index];
    }

    delete this.indexes[eventName];
  }

  destroy() {
    delete this.handlers;
    delete this.indexes;
  }

}
