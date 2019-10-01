import IndexedEvents, {AnyHandler} from '../../system/lib/IndexedEvents';


export default class IndexedEventEmitter<T extends AnyHandler = AnyHandler> {
  // TODO: общий пулл хэндлеров
  // IndexedEvents instances by event name
  private indexedEvents: {[index: string]: IndexedEvents<T>} = {};


  emit(eventName: string | number, ...args: any[]) {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].emit(...args);
  }

  // TODO: test
  emitSync(eventName: string | number, ...args: any[]): Promise<void> {
    if (!this.indexedEvents[eventName]) return Promise.resolve();

    return this.indexedEvents[eventName].emitSync(...args);
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string | number, handler: T): number {
    if (!this.indexedEvents[eventName]) {
      this.indexedEvents[eventName] = new IndexedEvents();
    }

    return this.indexedEvents[eventName].addListener(handler);
  }

  getHandlers(eventName: string | number): (T | undefined)[] {
    if (!this.indexedEvents[eventName]) return [];

    return this.indexedEvents[eventName].getHandlers();
  }

  once(eventName: string | number, handler: T): number {
    let wrapperIndex: number;
    const wrapper = ((...args: any[]) => {
      this.removeListener(eventName, wrapperIndex);
      handler(...args);
    }) as T;

    wrapperIndex = this.addListener(eventName, wrapper);

    return wrapperIndex;
  }

  removeListener(eventName: string | number, handlerIndex: number): void {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].removeListener(handlerIndex);

    // remove instance if it doesn't have any instances
    if (!this.indexedEvents[eventName].hasListeners()) {
      this.removeAllListeners(eventName);
    }
  }

  // TODO: remove
  removeAllListeners(eventName: string | number): void {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].removeAll();
    delete this.indexedEvents[eventName];
  }

  destroy() {
    for (let eventName of Object.keys(this.indexedEvents)) {
      this.removeAllListeners(eventName);
    }
  }

}