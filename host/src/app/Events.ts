import * as EventEmitter from 'eventemitter3';

import { generateEventName } from '../helpers/helpers';


// TODO: наверное не нужно
export const WHOLE_CATEGORY_MASK = '*';

interface TopicListener {
  // event name
  name: string;
  handler: Function;
  wrapper: (...args: Array<any>) => any;
}


export default class Events {
  private readonly events: EventEmitter = new EventEmitter();

  // TODO: меньше памяти будет занимать если разбить по eventName и там уже список

  private readonly topicListeners: Array<TopicListener> = [];


  emit(category: string, topic: string = WHOLE_CATEGORY_MASK, payload?: any): void {
    const eventName = generateEventName(category, topic);
    const wholeCatEventName = generateEventName(category, WHOLE_CATEGORY_MASK);

    this.events.emit(eventName, payload);
    // emit category listeners
    this.events.emit(wholeCatEventName, payload);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);
    const wrapper = (payload: any): void => {
      handler(payload);
    };

    const topicListener: TopicListener = {
      name: eventName,
      handler,
      wrapper
    };

    // listen to local events
    this.events.addListener(eventName, wrapper);
    // save it
    this.topicListeners.push(topicListener);
  }

  listenCategory(category: string, handler: (payload: any) => void): void {
    // TODO: зачем формировать????
    const eventName = generateEventName(category, WHOLE_CATEGORY_MASK);
    const wrapper = (payload: any): void => {
      handler(payload);
    };

    const topicListener: TopicListener = {
      name: eventName,
      handler,
      wrapper
    };

    // listen to local events
    this.events.addListener(eventName, wrapper);
    // save it
    this.topicListeners.push(topicListener);
  }

  removeListener(category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);

    const index: number = this.topicListeners.findIndex((item: TopicListener) => {
      return item.name === eventName && item.handler === handler;
    });

    // don't rise error - just exit if hasn't found any
    if (index < 0) return;

    const topicListener: TopicListener = this.topicListeners[index];

    // remove it
    this.topicListeners.splice(index, 1);
    this.events.removeListener(eventName, topicListener.wrapper);
  }

  removeCategoryListener(category: string, handler: (payload: any) => void): void {
    // TODO: зачем формировать????
    const eventName = generateEventName(category, WHOLE_CATEGORY_MASK);

    const index: number = this.topicListeners.findIndex((item: TopicListener) => {
      return item.name === eventName && item.handler === handler;
    });

    // don't rise error - just exit if hasn't found any
    if (index < 0) return;

    const topicListener: TopicListener = this.topicListeners[index];

    // remove it
    this.topicListeners.splice(index, 1);
    this.events.removeListener(eventName, topicListener.wrapper);
  }

}
