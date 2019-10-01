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
    // TODO: test
    return !this.handlers.length;
  }

  // TODO: не должно же ничего возвращать!!!!
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

      if (result && typeof result === 'object' && result.then) promises.push(result);
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

  // TODO: test
  destroy() {
    delete this.handlers;
  }

}
