import IndexedEvents, {AnyHandler} from './IndexedEvents';


export default class IndexedEventEmitter<T extends AnyHandler> {
  // IndexedEvents instances by event name
  private indexedEvents: {[index: string]: IndexedEvents<T>} = {};


  emit(eventName: string | number, ...args: any[]) {
    if (!this.indexedEvents[eventName]) return;

    this.indexedEvents[eventName].emit(...args);
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

  once(eventName: string | number, handler: T): number {
    let wrapperIndex: number = -1;
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
