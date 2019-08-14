import {LENGTH_AND_START_ARR_DIFFERENCE} from '../constants';


export type AnyHandler = (...args: any[]) => void;


export default class IndexedEvents<T extends AnyHandler> {
  private handlers: (T | undefined)[] = [];

  /**
   * Get all the handlers.
   * Removed handlers will be undefined
   */
  getHandlers(): (T | undefined)[] {
    return this.handlers;
  }

  hasListeners(): boolean {
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

    return this.handlers.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  once(handler: T): number {
    let wrapperIndex: number = -1;
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
