import { makeEventName } from './helpers/helpers';
import IndexedEventEmitter from './helpers/IndexedEventEmitter';


export default class Events {
  private readonly events = new IndexedEventEmitter<(data: any, topic?: string) => void>();
  private readonly separator: string;


  constructor(separator: string) {
    this.separator = separator;
  }


  emit(category: string, topic?: string, data?: any): void {
    const eventName = makeEventName(this.separator, category, topic);

    this.events.emit(eventName, data);
    // emit category listeners
    this.events.emit(category, data, topic);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = makeEventName(this.separator, category, topic);

    // listen to local events
    return this.events.addListener(eventName, handler);
  }

  once(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = makeEventName(this.separator, category, topic);

    // listen to local event once
    return this.events.once(eventName, handler);
  }

  /**
   * Listen all the topics of category
   */
  addCategoryListener(category: string, handler: (data: any, topic: string) => void): number {
    // listen to local events
    return this.events.addListener(category, handler as any);
  }

  removeListener(category: string, topic: string, handlerIndex: number): void {
    const eventName = makeEventName(this.separator, category, topic);

    this.events.removeListener(eventName, handlerIndex);
  }

  removeAllListeners(category: string, topic: string): void {
    const eventName = makeEventName(this.separator, category, topic);

    this.events.removeAllListeners(eventName);
  }

  removeCategoryListener(category: string, handlerIndex: number): void {
    this.events.removeListener(category, handlerIndex);
  }

}
