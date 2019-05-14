import IndexedEventEmitter from './IndexedEventEmitter';


/**
 * To listen category you should specify a topic as undefined.
 * The first argument of category listener will be a topic
 */
export default class CategorizedEvents {
  private readonly eventEmitter = new IndexedEventEmitter<(...args: any[]) => void>();
  private readonly separator: string;


  constructor(separator: string) {
    this.separator = separator;
  }


  emit(category: string, topic: string | undefined, ...args: any[]): void {
    if (topic) {
      const eventName = this.makeEventName(category, topic);
      this.eventEmitter.emit(eventName, ...args);
    }

    // emit category listeners
    this.eventEmitter.emit(category, topic, ...args);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string | undefined, handler: (data: any) => void): number {
    const eventName = this.makeEventName(category, topic);

    // listen to local events
    return this.eventEmitter.addListener(eventName, handler);
  }

  once(category: string, topic: string | undefined, handler: (data: any) => void): number {
    const eventName = this.makeEventName(category, topic);

    // listen to local event once
    return this.eventEmitter.once(eventName, handler);
  }

  // /**
  //  * Listen all the topics of category
  //  */
  // addCategoryListener(category: string, handler: (data: any, topic: string) => void): number {
  //   // listen to local events
  //   return this.eventEmitter.addListener(category, handler as any);
  // }

  removeListener(category: string, topic: string | undefined, handlerIndex: number): void {
    const eventName = this.makeEventName(category, topic);

    this.eventEmitter.removeListener(eventName, handlerIndex);
  }

  // removeCategoryListener(category: string, handlerIndex: number): void {
  //   this.eventEmitter.removeListener(category, handlerIndex);
  // }

  removeAllListeners(category: string, topic: string | undefined): void {
    const eventName = this.makeEventName(category, topic);

    this.eventEmitter.removeAllListeners(eventName);
  }

  destroy() {
    this.eventEmitter.destroy();
  }


  /**
   * Make combined event name.
   * makeEventName('cat', 'topic') => 'cat|topic'
   */
  private makeEventName(category: string, topic: string | undefined): string {
    if (!topic) return category;

    return [ category, topic ].join(this.separator);
  }

}
