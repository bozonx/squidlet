import System from '../app/System';
import Messenger from './Messenger';
import Message from './interfaces/Message';
import {SUBSCRIBE_TOPIC, UNSUBSCRIBE_TOPIC, RESPOND_TOPIC} from './BridgeSubscriber';
import categories from '../app/dict/categories';


type Handler = (message: Message) => void;


/**
 * Respond to request from remote host which subscribes to local event.
 */
export default class Bridge {
  private readonly system: System;
  private readonly messenger: Messenger;
  // handlers of local events by handleId
  private readonly handlers: {[index: string]: Handler} = {};


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init(): void {
    this.system.events.addCategoryListener(categories.messengerBridge, this.handleSpecialEvents);
  }

  private handleSpecialEvents = (message: Message): void => {
    // TODO: use message validator
    // it isn't a respond message - do nothing
    if (
      !message
      || typeof message !== 'object'
      || !message.from
    ) return;

    const {
      topic,
      from: subscriberHost,
      payload,
    } = message;

    if (topic === SUBSCRIBE_TOPIC) {
      // TODO: rise an error to error collector
      if (!this.checkIncomeMsgPayload(payload)) return;
      this.addLocalListener(payload.category, payload.topic, payload.handlerId, subscriberHost);
    }
    else if (topic === UNSUBSCRIBE_TOPIC) {

      // TODO: rise an error to error collector
      if (!this.checkIncomeMsgPayload(payload)) return;
      this.removeLocalListener(payload.category, payload.topic, payload.handlerId);
    }
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalListener(category: string, topic: string, handlerId: string, subscriberHost: string) {
    this.handlers[handlerId] = (payload: any): void => {
      this.response(subscriberHost, category, topic, handlerId, payload);
    };

    this.system.events.addListener(category, topic, this.handlers[handlerId]);
  }

  /**
   * Unsubscribe from local event
   */
  private removeLocalListener(category: string, topic: string, handlerId: string) {
    this.system.events.removeListener(category, topic, this.handlers[handlerId]);
    delete this.handlers[handlerId];
  }

  private response(
    subscriberHost: string,
    category: string,
    topic: string,
    handlerId: string,
    payload: any
  ): void {
    const message: Message = {
      category: categories.messengerBridge,
      topic: RESPOND_TOPIC,
      from: this.system.network.hostId,
      to: subscriberHost,
      payload: {
        category,
        topic,
        handlerId,
        payload,
      },
    };

    this.system.network.send(subscriberHost, message)
      .catch((err) => {
        // TODO: rise an error to error collector
      });
  }

  private checkIncomeMsgPayload(payload: any): boolean {
    if (typeof payload !== 'object') return false;

    return payload.category && payload.topic && payload.handlerId;
  }

}
