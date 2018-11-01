import {ALL_TOPICS} from '../app/dict/constants';

const _find = require('lodash/find');

import categories from '../app/dict/categories';
import System from '../app/System';
import Messenger from './Messenger';
import Message from './interfaces/Message';
import { generateEventName } from '../helpers/helpers';


// position of handler in HandlerItem
const HANDLER_ID_POSITION = 0;
const HANDLER_POSITION = 1;
export const SUBSCRIBE_TOPIC = 'subscribeToRemoteEvent';
export const UNSUBSCRIBE_TOPIC = 'unsubscribeFromRemoteEvent';
export const SUBSCRIBE_CATEGORY = 'subscribeToRemoteCategoryEvent';
export const UNSUBSCRIBE_CATEGORY = 'unsubscribeFromRemoteCategoryEvent';
export const RESPOND_TOPIC = 'respondOfRemoteEvent';

type Handler = (message: Message) => void;
type HandlerItem = [ string, Handler ];


/**
 * Subscribe to remote host's events
 */
export default class BridgeSubscriber {
  private readonly system: System;
  private readonly messenger: Messenger;
  // handlers of remote events by "toHost-category-topic"
  private readonly handlers: {[index: string]: Array<HandlerItem>} = {};

  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init(): void {
    this.system.events.addCategoryListener(categories.messengerBridge, this.handleSpecialEvents);
  }

  /**
   * Subscribe to remote host's events.
   * It sends special message to remote host, remote host responds messages on each event.
   * And it listens to this messages of remote evens.
   */
  subscribe(toHost: string, category: string, topic: string, handler: Handler): void {
    const handlerId: string = this.system.host.generateUniqId();
    const message: Message = this.generateSpecialMessage(handlerId, SUBSCRIBE_TOPIC, toHost, category, topic);

    // listen to messages from remote host
    this.addHandler(toHost, category, topic, handlerId, handler);

    // add handler of events of remote host
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  subscribeCategory(toHost: string, category: string, handler: Handler) {
    const handlerId: string = this.system.host.generateUniqId();
    const message: Message = this.generateSpecialMessage(handlerId, SUBSCRIBE_CATEGORY, toHost, category);

    // listen to messages from remote host
    this.addHandler(toHost, category, undefined, handlerId, handler);

    // add handler of events of remote host
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribe(toHost: string, category: string, topic: string, handler: Handler): void {
    const eventName = generateEventName(category, topic, toHost);
    const handlerId = this.findHandlerIdByHandler(eventName, handler);

    if (!handlerId) return;

    const message: Message = this.generateSpecialMessage(handlerId, UNSUBSCRIBE_TOPIC, toHost, category, topic);

    // remove local handler
    this.removeHandler(eventName, handler);

    // send message to remove remote emitter
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribeCategory(toHost: string, category: string, handler: Handler) {
    const eventName = generateEventName(category, undefined, toHost);
    const handlerId = this.findHandlerIdByHandler(eventName, handler);

    if (!handlerId) return;

    const message: Message = this.generateSpecialMessage(handlerId, UNSUBSCRIBE_CATEGORY, toHost, category);

    // remove local handler
    this.removeHandler(eventName, handler);

    // send message to remove remote emitter
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  /**
   * Register handler which will be risen on remote event
   */
  private addHandler(
    toHost: string,
    category: string,
    topic: string | undefined,
    handlerId: string,
    handler: Handler
  ) {
    const eventName = generateEventName(category, topic, toHost);
    const handlerItem: HandlerItem = [ handlerId, handler ];

    if (!this.handlers[eventName]) this.handlers[eventName] = [];

    // register listener
    this.handlers[eventName].push(handlerItem);
  }

  private removeHandler(eventName: string, handler: Function): void {
    const handlers: Array<HandlerItem> = this.handlers[eventName];
    const handlerIndex: number = handlers.findIndex((item: HandlerItem) => {
      return item[HANDLER_POSITION] === handler;
    });

    if (handlerIndex < 0) throw new Error(`Can't find handler index of "${eventName}"`);

    // remove handler item
    handlers.splice(handlerIndex, 1);
    // remove container
    if (!this.handlers[eventName].length) delete this.handlers[eventName];
  }

  private findHandlerIdByHandler(eventName: string, handler: Function): string {
    const handlers = this.handlers[eventName];
    const handlerItem: HandlerItem | undefined = _find(handlers, (item: HandlerItem) => {
      return item[HANDLER_POSITION] === handler;
    });

    if (!handlerItem) throw new Error(`Can't find handler of "${eventName}"`);

    return handlerItem[HANDLER_ID_POSITION];
  }

  private findHandlerById(eventName: string, handlerId: string): Function {
    const handlers = this.handlers[eventName];

    if (!handlers) throw new Error(`Can't find handlers of "${eventName}"`);

    const handlerItem: HandlerItem | undefined = _find(handlers, (item: HandlerItem) => {
      return item[HANDLER_ID_POSITION] === handlerId;
    });

    if (!handlerItem) throw new Error(`Can't find handlerId of "${eventName}" and handler id ${handlerId}`);

    return handlerItem[HANDLER_POSITION];
  }

  /**
   * Proceed responds
   */
  private handleSpecialEvents = (message: Message): void => {
    // TODO: use message validator
    // TODO: rise a warning
    // it isn't a respond message - do nothing
    if (
      !message
      || typeof message !== 'object'
      || !message.from
      || message.topic !== RESPOND_TOPIC
    ) return;

    const {
      from: remoteHost,
      payload,
    } = message;

    // TODO: rise an error to error collector
    if (!this.checkIncomeMsgPayload(payload)) return;

    // call subscriber with remote data
    const eventName = generateEventName(payload.category, payload.topic, remoteHost);
    const handler = this.findHandlerById(eventName, payload.hadlerId);

    // TODO: если пришло сообщение на которое нет подписки - вызвать unsubscribe и писать в лог

    // TODO: на самом деле handler ожидает сообщение, а тут не совсем сообщение {category, topic, handlerId, payload}

    // call handler
    handler(payload);
  }

  /**
   * Generate message to subscribe to event or unsubscribe
   */
  private generateSpecialMessage(
    handlerId: string,
    specialTopic: string,
    toHost: string,
    eventCategory: string,
    eventTopic: string = ALL_TOPICS,
  ): Message {
    return {
      // special category
      category: categories.messengerBridge,
      topic: specialTopic,
      from: this.system.network.hostId,
      to: toHost,
      payload: {
        category: eventCategory,
        topic: eventTopic,
        handlerId,
      },
    };
  }

  private checkIncomeMsgPayload(payload: any): boolean {
    if (typeof payload !== 'object') return false;

    return payload.category && payload.topic && payload.handlerId;
  }

}
