import { generateEventName } from '../helpers/helpers';
import IndexedEventEmitter from '../helpers/IndexedEventEmitter';


export default class Events {
  private readonly events: IndexedEventEmitter = new IndexedEventEmitter();


  emit(category: string, topic: string, data?: any): void {
    const eventName = generateEventName(category, topic);

    this.events.emit(eventName, data);
    // emit category listeners
    this.events.emit(category, data);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = generateEventName(category, topic);

    // listen to local events
    return this.events.addListener(eventName, handler);
  }

  once(category: string, topic: string, handler: (data: any) => void): number {
    const eventName = generateEventName(category, topic);

    // listen to local event once
    return this.events.once(eventName, handler);
  }

  /**
   * Listen all the topics of category
   */
  addCategoryListener(category: string, handler: (data: any) => void): number {
    // listen to local events
    return this.events.addListener(category, handler);
  }

  removeListener(category: string, topic: string, handlerId: number): void {
    const eventName = generateEventName(category, topic);

    this.events.removeListener(eventName, handlerId);
  }

  removeCategoryListener(category: string, handlerId: number): void {
    this.events.removeListener(category, handlerId);
  }

}
