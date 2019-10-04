import {isPromise} from './common';

export type AnyHandler = (...args: any[]) => void;


export default class IndexedEvents<T extends AnyHandler> {
  // all the handlers by index, removed handlers are empty
  private handlers: (T | undefined)[] = [];

  /**
   * Get all the handlers.
   * Removed handlers will be undefined
   */
  getListeners(): (T | undefined)[] {
    return this.handlers;
  }

  hasListeners(): boolean {
    return Boolean(this.handlers.length);
  }

  emit: T = ((...args: any[]) => {
    for (let handler of this.handlers) {
      if (handler) handler(...args);
    }
  }) as T;

  emitSync = async (...args: any[]): Promise<void> => {
    for (let handler of this.handlers) {
      if (!handler) continue;

      await handler(...args);
    }
  }

  // TODO: можно сделать вариант когда выполняются все, ошибочные пропускаются и выводятся ошибки списокм

  // TODO: test
  emitAll = async (...args: any[]): Promise<void> => {
    const promises: Promise<any>[] = [];

    for (let handler of this.handlers) {
      if (!handler) continue;

      const result: any = handler(...args);

      if (isPromise(result)) {
        promises.push(result);
      }
    }

    return Promise.all(promises).then(() => undefined);
  }

  /**
   * Register listener and return its index.
   */
  addListener(handler: T): number {
    this.handlers.push(handler);

    return this.handlers.length - 1;
  }

  once(handler: T): number {
    let wrapperIndex: number;
    const wrapper = ((...args: any[]) => {
      this.removeListener(wrapperIndex);
      // return in promise case
      return handler(...args);
    }) as T;

    wrapperIndex = this.addListener(wrapper);

    return wrapperIndex;
  }

  removeListener(handlerIndex: number): void {
    if (!this.handlers[handlerIndex]) return;

    delete this.handlers[handlerIndex];
  }

  removeAll(): void {
    this.handlers.splice(0, this.handlers.length);
  }

  destroy() {
    delete this.handlers;
  }

}
