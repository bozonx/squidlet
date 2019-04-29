import IndexedEvents, {AnyHandler} from './IndexedEvents';


export default class IndexedEventEmitter<T extends AnyHandler> {
  // IndexedEvents instances by event name
  private indexedEvents: {[index: string]: IndexedEvents<T>} = {};


  // TODO: как сделать типизированный ?? или хотябы error first
  emit(eventName: string, ...args: any[]) {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].emit(...args);
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string, handler: T): number {
    if (!this.indexedEvents[eventName]) {
      this.indexedEvents[eventName] = new IndexedEvents();
    }

    return this.indexedEvents[eventName].addListener(handler);
  }

  once(eventName: string, handler: T): number {
    let wrapperIndex: number = -1;
    const wrapper = ((...args: any[]) => {
      this.removeListener(eventName, wrapperIndex);
      handler(...args);
    }) as T;

    wrapperIndex = this.addListener(eventName, wrapper);

    return wrapperIndex;
  }

  removeListener(eventName: string, handlerIndex: number): void {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].removeListener(handlerIndex);

    // remove instance if it doesn't have any instances
    if (!this.indexedEvents[eventName].hasListeners()) {
      this.removeAllListeners(eventName);
    }
  }

  removeAllListeners(eventName: string): void {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].removeAll();
    delete this.indexedEvents[eventName];
  }

  destroy() {
    // TODO: test

    for (let eventName of Object.keys(this.indexedEvents)) {
      this.removeAllListeners(eventName);
    }
  }

}
