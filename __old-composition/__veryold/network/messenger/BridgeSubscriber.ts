import {ALL_TOPICS} from '../dict/constants';
import System from '../System';
import Messenger from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/Messenger';
import Message from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';


// // position of handler in HandlerItem
export const SUBSCRIBE_TOPIC = 'subscribeToRemoteEvent';
export const UNSUBSCRIBE_TOPIC = 'unsubscribeFromRemoteEvent';
export const SUBSCRIBE_CATEGORY = 'subscribeToRemoteCategoryEvent';
export const UNSUBSCRIBE_CATEGORY = 'unsubscribeFromRemoteCategoryEvent';
export const RESPOND_TOPIC = 'respondOfRemoteEvent';
// category where will handlers which react on remote evens will be places
export const SUBSCRIBER_SPECIAL_CATEGORY = 'subscrSpecCat';

type Handler = (message: Message) => void;


/**
 * Subscribe to remote host's events
 */
export default class BridgeSubscriber {
  private readonly system: System;
  private readonly messenger: Messenger;


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
   * And it listens to this messages of remote events.
   */
  subscribe(toHost: string, category: string, topic: string, handler: Handler): string {
    if (this.messenger.isLocalHost(toHost)) {
      // subscribe to local events
      const handlerIndex: number = this.system.events.addListener(category, topic, handler);
      // convert local index number to string
      return handlerIndex.toString();
    }

    // else make remote handler

    const handlerId: string = this.system.host.generateUniqId();
    const message: Message = this.generateSpecialMessage(handlerId, SUBSCRIBE_TOPIC, toHost, category, topic);

    // listen to messages from remote host

    this.system.events.addListener(SUBSCRIBER_SPECIAL_CATEGORY, handlerId, handler);

    // add handler of events of remote host
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });

    return handlerId;
  }

  subscribeCategory(toHost: string, category: string, handler: Handler): string {
    if (this.messenger.isLocalHost(toHost)) {
      // subscribe to local events
      const handlerIndex: number = this.system.events.addCategoryListener(category, handler);

      // convert local index number to string
      return handlerIndex.toString();
    }

    // else make remote handler

    const handlerId: string = this.system.host.generateUniqId();
    const message: Message = this.generateSpecialMessage(handlerId, SUBSCRIBE_CATEGORY, toHost, category);

    // listen to messages from remote host

    this.system.events.addListener(SUBSCRIBER_SPECIAL_CATEGORY, handlerId, handler);

    // add handler of events of remote host
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });

    return handlerId;
  }

  unsubscribe(toHost: string, category: string, topic: string, handlerId: string): void {
    if (this.messenger.isLocalHost(toHost)) {
      // subscribe to local events
      const handlerIndex = parseInt(handlerId);

      if (Number.isNaN(handlerIndex)) {
        this.system.log.error(
          `BridgeSubscriber.subscribeCategory("${toHost}", "${category}", "${handlerId}"). ` +
          `Wrong handlerId: "${handlerId}". Local handlerId has to be a number as a string.`
        );
      }

      return this.system.events.removeListener(category, topic, handlerIndex);
    }

    const message: Message = this.generateSpecialMessage(handlerId, UNSUBSCRIBE_TOPIC, toHost, category, topic);

    // remove local handler
    this.system.events.removeAllListeners(SUBSCRIBER_SPECIAL_CATEGORY, handlerId);

    // send message to remove remote emitter
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribeCategory(toHost: string, category: string, handlerId: string) {
    if (this.messenger.isLocalHost(toHost)) {
      // subscribe to local events
      const handlerIndex = parseInt(handlerId);

      if (Number.isNaN(handlerIndex)) {
        this.system.log.error(
          `BridgeSubscriber.subscribeCategory("${toHost}", "${category}", "${handlerId}"). ` +
          `Wrong handlerId. Local handlerId has to be a number as a string.`
        );
      }

      return this.system.events.removeCategoryListener(category, handlerIndex);
    }

    const message: Message = this.generateSpecialMessage(handlerId, UNSUBSCRIBE_CATEGORY, toHost, category);

    // remove local handler
    this.system.events.removeAllListeners(SUBSCRIBER_SPECIAL_CATEGORY, handlerId);

    // send message to remove remote emitter
    this.system.network.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
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
      // from: remoteHost,
      payload,
    } = message;

    // TODO: rise an error to error collector
    if (!this.checkIncomeMsgPayload(payload)) return;

    // call subscriber with remote data

    // TODO: если пришло сообщение на которое нет подписки - вызвать unsubscribe и писать в лог

    // TODO: на самом деле handler ожидает сообщение, а тут не совсем сообщение {category, topic, handlerId, payload}

    // call handler
    this.system.events.emit(SUBSCRIBER_SPECIAL_CATEGORY, payload.handlerId, payload);
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
