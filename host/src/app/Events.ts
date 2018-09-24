import * as EventEmitter from 'eventemitter3';

import { generateEventName } from '../helpers/helpers';


export default class Events {
  private readonly events: EventEmitter = new EventEmitter();


  emit(category: string, topic: string, payload?: any): void {
    const eventName = generateEventName(category, topic);

    this.events.emit(eventName, payload);
    // emit category listeners
    this.events.emit(category, payload);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);

    // listen to local events
    this.events.addListener(eventName, handler);
  }

  /**
   * Listen all the topics of category
   */
  addCategoryListener(category: string, handler: (payload: any) => void): void {
    // listen to local events
    this.events.addListener(category, handler);
  }

  removeListener(category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);

    this.events.removeListener(eventName, handler);
  }

  removeCategoryListener(category: string, handler: (payload: any) => void): void {
    this.events.removeListener(category, handler);
  }

}
