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

  removeListener(handlerId: number): void {
    if (!this.handlers[handlerId]) return;

    this.handlers.splice(handlerId, 1);
  }

}
