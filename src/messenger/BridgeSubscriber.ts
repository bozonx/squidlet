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
  private readonly respondTopic: string = 'respondOfRemoteEvent';
  private readonly unsubscribeTopic: string = 'unsubscribeFromRemoteEvent';
  // handlers of remote events by "toHost-category-topic"
  private readonly handlers: {[index: string]: Array<HandlerItem>} = {};

  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init(): void {
    this.system.network.listenIncome((message: Message): void => {
      // TODO: нужна проверка что это именно сообщение ???
      this.handleIncomeMessages(message);
    });
  }

  subscribe(toHost: string, category: string, topic: string, handler: (payload: any) => void): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerId: string = this.system.io.generateUniqId();
    const message: Message = {
      category: this.systemCategory,
      topic: this.subscribeTopic,
      from: this.system.network.hostId,
      to: toHost,
      payload: {
        category,
        topic,
        handlerId,
      },
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
    const handlerId = this.findHandlerIdByHandler(eventName, handler);
    const message: Message = {
      category: this.systemCategory,
      topic: this.unsubscribeTopic,
      from: this.system.network.hostId,
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


  /**
   * Proceed responds
   */
  private handleIncomeMessages(message: Message): void {
    const {
      category,
      topic,
      from: remoteHost,
      payload,
    } = message;

    if (category !== this.systemCategory) return;

    if (topic === this.respondTopic) {
      // call subscriber with remote data
      const eventName = generateEventName(payload.category, payload.topic, remoteHost);
      const handler = this.findHandlerById(eventName, payload.hadlerId);

      // TODO: если пришло сообщение на которое нет подписки - вызвать unsubscribe и писать в лог

      handler(payload.payload);
    }
  }

  private findHandlerIdByHandler(eventName: string, handler: Function): string {
    const handlers = this.handlers[eventName];
    const handerItem: HandlerItem | undefined = _.find(handlers, (item: HandlerItem) => {
      return item.handler === handler;
    });

    if (!handerItem) throw new Error(`Can't find handler of "${eventName}"`);

    return handerItem.handlerId;
  }

  private findHandlerById(eventName: string, handlerId: string): Function {
    const handlers = this.handlers[eventName];

    if (!handlers) throw new Error(`Can't find handlers of "${eventName}"`);

    const handerItem: HandlerItem | undefined = _.find(handlers, (item: HandlerItem) => {
      return item.handlerId === handlerId;
    });

    if (!handerItem) throw new Error(`Can't find handlerId of "${eventName}" and handler id ${handlerId}`);

    return handerItem.handler;
  }

  private removeHandler(eventName: string, handler: Function): void {
    const handlers = this.handlers[eventName];
    const handlerIndex = _.findIndex(handlers, (item) => {
      return item.handler === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${eventName}"`);

    handlers.splice(handlerIndex, 1);
  }

}
