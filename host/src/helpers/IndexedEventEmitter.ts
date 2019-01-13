import IndexedEvents, {AnyHandler} from './IndexedEvents';


export default class IndexedEventEmitter<T extends AnyHandler> {
  private handlersById: {[index: string]: IndexedEvents<T>} = {};


  // TODO: как сделать типизированный ?? или хотябы error first
  emit(eventName: string, ...args: any[]) {
    if (!this.handlersById[eventName]) return;

    this.handlersById[eventName].emit(...args);
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string, handler: T): number {
    if (!this.handlersById[eventName]) {
      this.handlersById[eventName] = new IndexedEvents();
    }

    return this.handlersById[eventName].addListener(handler);
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
    if (!this.handlersById[eventName]) return;

    this.handlersById[eventName].removeListener(handlerIndex);

    // remove instance if it doesn't have any instances
    if (!this.handlersById[eventName].hasListeners()) {
      this.removeAllListeners(eventName);
    }
  }

  removeAllListeners(eventName: string): void {
    if (!this.handlersById[eventName]) return;

    this.handlersById[eventName].removeAll();
    delete this.handlersById[eventName];
  }

}
