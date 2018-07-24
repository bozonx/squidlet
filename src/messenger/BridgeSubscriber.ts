import * as _ from 'lodash';

import System from '../app/System';
import Messenger, {SYSTEM_CATEGORY} from './Messenger';
import Message from './interfaces/Message';
import { generateEventName } from '../helpers/helpers';


type Handler = (payload: any) => void;

interface HandlerItem {
  handlerId: string;
  handler: Handler;
}

/**
 * Subscribe to remote host's events
 */
export default class BridgeSubscriber {
  private readonly system: System;
  private readonly messenger: Messenger;

  // TODO: make consts

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
    this.system.events.addListener(SYSTEM_CATEGORY, undefined, this.handleSystemEvents);

    // TODO: слушать events - так как все сообщение направленны туда из Messanger

    this.system.network.listenIncome((error: Error | null, message: Message): void => {
      if (error) {
        // TODO: что делать в случае ошибки - наверное в лог писать или сделать message.error ???
        this.system.log.error(error.toString());

        return;
      }

      // TODO: нужна проверка что это именно сообщение ???
      this.handleIncomeMessages(message);
    });
  }

  subscribe(toHost: string, category: string, topic: string, handler: Handler): void {

    // TODO: в handler должно передаться message либо - payload, message

    const handlerId: string = this.system.io.generateUniqId();
    const message: Message = this.generateMessage(toHost, category, topic, this.subscribeTopic, handlerId);

    this.addHander(category, topic, toHost, handlerId, handler);

    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribe(toHost: string, category: string, topic: string, handler: Handler): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerId = this.findHandlerIdByHandler(eventName, handler);
    const message: Message = this.generateMessage(toHost, category, topic, this.unsubscribeTopic, handlerId);

    this.removeHandler(eventName, handler);

    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }


  private addHander(
    toHost: string,
    category: string,
    topic: string,
    handlerId: string,
    handler: Handler
  ): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerItem: HandlerItem = {
      handlerId,
      handler,
    };

    if (!this.handlers[eventName]) this.handlers[eventName] = [];

    // register listener
    this.handlers[eventName].push(handlerItem);
  }

  private removeHandler(eventName: string, handler: Function): void {
    const handlers: Array<HandlerItem> = this.handlers[eventName];
    const handlerIndex: number = handlers.findIndex((item) => {
      return item.handler === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${eventName}"`);

    handlers.splice(handlerIndex, 1);

    // TODO: а удалить сам this.handlers[eventName] ?
  }

  private handleSystemEvents = (): void => {
    // TODO: !!!!
  }

  private generateMessage(toHost: string, category: string, topic: string, specialTopic: string, handlerId: string): Message {
    return {
      category: SYSTEM_CATEGORY,
      topic: specialTopic,
      from: this.system.network.hostId,
      to: toHost,
      payload: {
        category,
        topic,
        handlerId,
      },
    };
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

    if (category !== SYSTEM_CATEGORY) return;

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

}
