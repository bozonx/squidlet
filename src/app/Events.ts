import * as _ from 'lodash';
import * as EventEmitter from 'events';

import { eventNameSeparator } from '../helpers/helpers';


interface TopicListener {
  // event name
  name: string;
  handler: Function;
  wrapper: (...args: Array<any>) => any;
}

export default class Events {
  readonly allTopicsMask = '*';
  private readonly events: EventEmitter = new EventEmitter();
  private readonly topicListeners: Array<TopicListener> = [];

  constructor() {
  }

  emit(category: string, topic: string = '*', payload: any): void {
    const eventName = this.generateEventName(category, topic);

    this.events.emit(eventName, category, topic, payload);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string = '*', handler: (payload: any) => void): void {
    const eventName = this.generateEventName(category, topic);
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
    const eventName = this.generateEventName(category, topic);

    const index: number = _.findIndex(this.topicListeners, (item: TopicListener) => {
      return item.name === eventName && item.handler === handler;
    });

    // don't rise error - just exit if hasn't found any
    if (index <= 0) return;

    const topicListener: TopicListener = this.topicListeners[index];
    // remove it
    this.topicListeners.splice(index, 1);

    this.events.removeListener(category, topicListener.wrapper);
  }

  private generateEventName(category: string, topic: string): string {
    if (!topic || topic === '*') return category;

    return [ category, topic ].join(eventNameSeparator);
  }

}
