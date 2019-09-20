import {lastItem} from './arrays';


export type AnyHandler = (...args: any[]) => void;

// TODO: можно формировать сткроковой индекс в виде байтов 16бит - тогда он может быть бесконечной длины


export default class IndexedEvents<T extends AnyHandler> {
  // TODO: если много создавать и удалять листенеров - то индекс может стать очень большим
  private handlers: (T | undefined)[] = [];

  /**
   * Get all the handlers.
   * Removed handlers will be undefined
   */
  getHandlers(): (T | undefined)[] {
    return this.handlers;
  }

  hasListeners(): boolean {
    // TODO: better to check length
    let hasInstance: boolean = false;

    for (let handler of this.handlers) {
      if (handler) {
        hasInstance = true;

        break;
      }
    }

    return hasInstance;
  }

  emit: T = ((...args: any[]) => {
    for (let handler of this.handlers) {
      if (handler) handler(...args);
    }
  }) as T;

  // TODO: review
  emitSync = ((...args: any[]): Promise<void> => {
    const promises: Promise<any>[] = [];

    for (let handler of this.handlers) {
      if (!handler) continue;

      const result: any = handler(...args);

      if (typeof result === 'object' && result.then) promises.push(result);
    }

    return Promise.all(promises).then(() => undefined);
  });

  /**
   * Register listener and return its index
   */
  addListener(handler: T): number {
    this.handlers.push(handler);

    return lastItem(this.handlers);
  }

  once(handler: T): number {
    let wrapperIndex: number;
    const wrapper = ((...args: any[]) => {
      this.removeListener(wrapperIndex);
      handler(...args);
    }) as T;

    wrapperIndex = this.addListener(wrapper);

    return wrapperIndex;
  }

  removeListener(handlerIndex: number): void {
    if (!this.handlers[handlerIndex]) return;

    this.handlers[handlerIndex] = undefined;
  }

  removeAll(): void {
    this.handlers.splice(0, this.handlers.length);
  }

}
