import {LENGTH_AND_START_ARR_DIFFERENCE} from '../app/dict/constants';


export type EventHandler = (...args: any[]) => void;
type Handlers = Array<EventHandler | undefined>;


export default class IndexedEvents {
  private handlers: Handlers = [];

  /**
   * Get all the handlers.
   * Removed handlers will be undefined
   */
  getHandlers(): Handlers {
    return this.handlers;
  }

  hasListeners() {
    let hasInstance: boolean = false;

    for (let handler of this.handlers) {
      if (handler) {
        hasInstance = true;

        break;
      }
    }

    return hasInstance;
  }

  emit(...args: any[]) {
    for (let handler of this.handlers) {
      if (handler) handler(...args);
    }
  }

  /**
   * Register listener and return its index
   */
  addListener(handler: EventHandler): number {
    this.handlers.push(handler);

    return this.handlers.length - LENGTH_AND_START_ARR_DIFFERENCE;
  }

  once(handler: EventHandler): number {
    let wrapperIndex: number = -1;
    const wrapper: EventHandler = (...args: any[]) => {
      this.removeListener(wrapperIndex);
      handler(...args);
    };

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
