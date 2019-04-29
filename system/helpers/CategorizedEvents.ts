import IndexedEventEmitter from './IndexedEventEmitter';


export const ALL_TOPICS = '*';


export default class CategorizedEvents {
  private readonly eventEmitter = new IndexedEventEmitter<(data: any, topic?: string) => void>();
  private readonly separator: string;


  constructor(separator: string) {
    this.separator = separator;
  }


  emit(category: string, topic?: string, data?: any): void {
    if (topic) {
      const eventName = this.makeEventName(this.separator, category, topic);
      this.eventEmitter.emit(eventName, data);
    }

    // emit category listeners
    this.eventEmitter.emit(category, data, topic);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = this.makeEventName(this.separator, category, topic);

    // listen to local events
    return this.eventEmitter.addListener(eventName, handler);
  }

  once(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = this.makeEventName(this.separator, category, topic);

    // listen to local event once
    return this.eventEmitter.once(eventName, handler);
  }

  /**
   * Listen all the topics of category
   */
  addCategoryListener(category: string, handler: (data: any, topic: string) => void): number {
    // listen to local events
    return this.eventEmitter.addListener(category, handler as any);
  }

  removeListener(category: string, topic: string, handlerIndex: number): void {
    const eventName = this.makeEventName(this.separator, category, topic);

    this.eventEmitter.removeListener(eventName, handlerIndex);
  }

  removeCategoryListener(category: string, handlerIndex: number): void {
    this.eventEmitter.removeListener(category, handlerIndex);
  }

  removeAllListeners(category: string, topic: string): void {
    const eventName = this.makeEventName(this.separator, category, topic);

    this.eventEmitter.removeAllListeners(eventName);
  }

  destroy() {
    this.eventEmitter.destroy();
  }


  /**
   * Make combined event name which is used in host's event system.
   * makeEventName('cat', 'topic', 'name', 'otherName') => 'cat|topic|name|otherName'
   */
  private makeEventName(eventNameSeparator: string, category: string, topic: string = ALL_TOPICS, ...others: Array<string>): string {
    return [ category, topic, ...others ].join(eventNameSeparator);
  }

}
