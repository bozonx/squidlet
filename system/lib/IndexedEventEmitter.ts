export type DefaultHandler = (...args: any[]) => void;


export default class IndexedEventEmitter<T extends DefaultHandler = DefaultHandler> {
  // all the handlers
  private handlers: T[] = [];
  // indexes by event names
  private indexes: {[index: string]: number[]} = {};


  emit(eventName: string | number, ...args: any[]) {
    if (!this.indexes[eventName]) return;

    for (let index of this.indexes[eventName]) {
      this.handlers[index](...args);
    }
  }

  // TODO: test
  emitSync(eventName: string | number, ...args: any[]): Promise<void> {
    if (!this.indexes[eventName]) return Promise.resolve();

    const promises: Promise<any>[] = [];

    for (let index of this.indexes[eventName]) {
      const result: any = this.handlers[index](...args);

      if (result && typeof result === 'object' && result.then) promises.push(result);
    }

    return Promise.all(promises).then(() => undefined);
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string | number, handler: T): number {
    if (!this.indexes[eventName]) {
      this.indexes[eventName] = [];
    }

    this.handlers.push(handler);

    const index: number = this.handlers.length - 1;

    this.indexes[eventName].push(index);

    return index;
  }

  // TODO: test
  getHandlers(eventName: string | number): T[] {
    if (!this.indexes[eventName]) return [];

    return this.indexes[eventName].map((index: number) => this.handlers[index]);
  }

  once(eventName: string | number, handler: T): number {
    let wrapperIndex: number;
    const wrapper = ((...args: any[]) => {
      this.removeListener(wrapperIndex, eventName);
      handler(...args);
    }) as T;

    wrapperIndex = this.addListener(eventName, wrapper);

    return wrapperIndex;
  }

  /**
   * Remove handler by index.
   * You can omit eventName, but if you defined it then removing will be faster.
   */
  removeListener(handlerIndex: number, eventName?: string | number): void {
    // TODO: test

    if (eventName) {
      if (!this.indexes[eventName]) return;

      const found: number | undefined = this.indexes[eventName].find((item) => item === handlerIndex);

      if (typeof found === 'undefined') return;

      this.indexes[eventName].slice(handlerIndex, 1);

      delete this.handlers[handlerIndex];

      return;
    }

    // find the event name and remove it's index.
    for (let eventName of Object.keys(this.indexes)) {
      const found: number | undefined = this.indexes[eventName].find((item) => item === handlerIndex);

      if (typeof found !== 'undefined') {
        this.indexes[eventName].slice(handlerIndex, 1);

        delete this.handlers[handlerIndex];

        return;
      }
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
    for (let eventName of Object.keys(this.indexes)) {
      this.removeAllListeners(eventName);
    }
  }

}
