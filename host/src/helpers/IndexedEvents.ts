import {LENGTH_AND_START_ARR_DIFFERENCE} from '../app/dict/constants';


export type EventHandler = (...args: any[]) => void;


export default class IndexedEvents {
  private handlers: EventHandler[] = [];

  getHandlers(): EventHandler[] {
    return this.handlers;
  }

  emit(...args: any[]) {
    for (const handler of this.handlers) {
      handler(...args);
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
    let wrapperIndex: number;
    const wrapper: EventHandler = (...args: any[]) => {
      this.removeListener(wrapperIndex);
      handler(...args);
    };

    wrapperIndex = this.addListener(wrapper);

    return wrapperIndex;
  }

  removeListener(handlerIndex: number): void {
    if (!this.handlers[handlerIndex]) return;

    this.handlers.splice(handlerIndex, 1);
  }

  removeAll(): void {
    this.handlers.splice(0, this.handlers.length);
  }

}
