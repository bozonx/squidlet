import * as EventEmitter from 'eventemitter3';

import { generateEventName } from '../helpers/helpers';


export const ALL_TOPIC_MASK = '*';

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


  emit(category: string, topic: string = '*', payload?: any): void {
    const eventName = generateEventName(category, topic);

    this.events.emit(eventName, category, topic, payload);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string = '*', handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);
    const wrapper = (msgCategory: string, msgTopic: string, payload: any): void => {
      if (msgCategory === category && msgTopic === topic) {
        handler(payload);
      }
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

  removeListener(category: string, topic: string = '*', handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic);

    const index: number = this.topicListeners.findIndex((item: TopicListener) => {
      return item.name === eventName && item.handler === handler;
    });

    // don't rise error - just exit if hasn't found any
    if (index <= 0) return;

    const topicListener: TopicListener = this.topicListeners[index];
    // remove it
    this.topicListeners.splice(index, 1);

    this.events.removeListener(category, topicListener.wrapper);
  }

}
