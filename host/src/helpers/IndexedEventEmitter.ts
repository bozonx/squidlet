import IndexedEvents, {EventHandler} from './IndexedEvents';


export default class IndexedEventEmitter {
  private handlersById: {[index: string]: IndexedEvents} = {};


  emit(eventName: string, ...args: any[]) {
    if (!this.handlersById[eventName]) return;

    this.handlersById[eventName].emit(...args);
  }

  /**
   * Register listener and return its index
   */
  addListener(eventName: string, handler: EventHandler): number {
    this.handlersById[eventName] = new IndexedEvents();

    return this.handlersById[eventName].addListener(handler);
  }

  once(eventName: string, handler: EventHandler): number {
    let handlerIndex: number;
    const wrapper: EventHandler = (...args: any[]) => {
      this.removeListener(eventName, handlerIndex);
      handler(...args);
    };

    handlerIndex = this.addListener(eventName, wrapper);

    return handlerIndex;
  }

  removeListener(eventName: string, handlerId: number): void {
    if (!this.handlersById[eventName]) return;

    this.handlersById[eventName].removeListener(handlerId);
  }

}
