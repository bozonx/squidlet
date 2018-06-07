import * as EventEmitter from 'events';
import { eventNameSeparator } from '../helpers/helpers';

import App from './App';


interface TopicListener {
  category: string;
  topic: string;
  handler: Function;
  wrapper: (...args: Array<any>) => any;
}

export default class Events {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly topicListeners: Array<TopicListener> = [];

  constructor(app: App) {
    this.app = app;
  }

  emit(category: string, topic: string = '*', payload: any): void {
    const eventName = this.generateEventName(category, topic);

    this.events.emit(eventName, category, topic, payload);
  }

  /**
   * Listen for local messages of certain category.
   */
  addListener(category: string, topic: string = '*', handler: (payload: any) => void): void {
    const wrapper = (msgCategory: string, msgTopic: string, payload: any): void => {
      if (msgCategory === category && msgTopic === topic) {
        handler(payload);
      }
    };

    const topicListener: TopicListener = {
      category,
      topic,
      handler,
      wrapper
    };

    // listen to local events
    this.events.addListener(category, wrapper);
    // save it
    this.topicListeners.push(topicListener);
  }

  removeListener(category: string, topic: string = '*', handler: (payload: any) => void): void {
    this.events.removeListener(category, handler);
  }

  private generateEventName(category: string, topic: string): string {
    if (!topic || topic === '*') return category;

    return [ category, topic ].join(eventNameSeparator);
  }

}
