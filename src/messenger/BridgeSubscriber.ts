import * as _ from 'lodash';

import System from '../app/System';
import Messenger from './Messenger';
import Message from './interfaces/Message';
import { generateEventName } from '../helpers/helpers';


interface HandlerItem {
  handlerId: string;
  handler: Function;
}

/**
 * Subscribe to remote host's events
 */
export default class Bridge {
  private readonly system: System;
  private readonly messenger: Messenger;
  private readonly systemCategory: string = 'system';
  private readonly subscribeTopic: string = 'subscribeToRemoteEvent';
  private readonly unsubscribeTopic: string = 'unsubscribeFromRemoteEvent';
  // handlers of remote events by "toHost-category-topic"
  private readonly handlers: {[index: string]: Array<HandlerItem>} = {};

  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init(): void {
  }

  subscribe(toHost: string, category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerId: string = this.system.io.generateUniqId();
    const message: Message = {
      category: this.systemCategory,
      topic: this.subscribeTopic,
      to: toHost,
      payload: handlerId,
    };
    const handlerItem: HandlerItem = {
      handlerId,
      handler,
    };

    if (!this.handlers[eventName]) this.handlers[eventName] = [];

    // register listener
    this.handlers[eventName].push(handlerItem);

    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribe(toHost: string, category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerId = this.findHandlerId(eventName, handler);
    const message: Message = {
      category: this.systemCategory,
      topic: this.unsubscribeTopic,
      to: toHost,
      payload: {
        category,
        topic,
        handlerId,
      },
    };

    this.removeHandler(eventName, handler);

    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }


  private handleIncomeMessages(message: Message): void {
    if (message.category !== this.systemCategory) return;

    if (message.topic === this.subscribeTopic) {
      this.addLocalListener();
    }

    if (message.topic === this.unsubscribeTopic) {
      this.removeLocalListener();
    }
  }

  private findHandlerId(eventName: string, handler: Function): string {
    const handlers = this.handlers[eventName];
    const handerItem: HandlerItem | undefined = _.find(handlers, (item: HandlerItem) => {
      return item.handler === handler;
    });

    if (!handerItem) throw new Error(`Can't find handler of "${eventName}"`);

    return handerItem.handlerId;
  }

  private removeHandler(eventName: string, handler: Function): void {
    // TODO: !!!!
    delete this.handlers[eventName];
  }

}
