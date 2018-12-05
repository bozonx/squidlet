type EventHandler = (...args: any[]) => void;


const LENGTH_AND_START_ARR_DIFFERENCE = 1;


export default class IndexedEvents {
  private handlers: EventHandler[] = [];


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
    let handlerIndex: number;
    const wrapper: EventHandler = (...args: any[]) => {
      this.removeListener(handlerIndex);
      handler(...args);
    };

    handlerIndex = this.addListener(wrapper);

    return handlerIndex;
  }

  removeListener(handlerId: number): void {
    if (!this.handlers[handlerId]) return;

    this.handlers.splice(handlerId, 1);
  }

}
