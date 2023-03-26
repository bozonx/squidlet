import System from '../System';
import Messenger from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/Messenger';
import Message from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/interfaces/Message';
import {
  SUBSCRIBE_TOPIC,
  UNSUBSCRIBE_TOPIC,
  RESPOND_TOPIC,
  SUBSCRIBE_CATEGORY,
  UNSUBSCRIBE_CATEGORY
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/__veryold/network/messenger/BridgeSubscriber';
import {ALL_TOPICS} from '../dict/constants';


/**
 * Respond to request from remote host which subscribes to local event.
 */
export default class BridgeResponder {
  private readonly system: System;
  private readonly messenger: Messenger;
  // handlers indexes of local events by handleId
  private readonly handlersIndexes: {[index: string]: number} = {};


  constructor(system: System, messenger: Messenger) {
    this.system = system;
    this.messenger = messenger;
  }

  init(): void {
    this.system.events.addCategoryListener(categories.messengerBridge, this.handleSpecialEvents);
  }

  private handleSpecialEvents = (message: Message): void => {
    // TODO: use message validator
    // TODO: rise a warning
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
    else if (topic === SUBSCRIBE_CATEGORY) {
      // TODO: rise an error to error collector
      if (!this.checkIncomeMsgPayload(payload)) return;
      this.addLocalCategoryListener(payload.category, payload.handlerId, subscriberHost);
    }
    else if (topic === UNSUBSCRIBE_CATEGORY) {
      // TODO: rise an error to error collector
      if (!this.checkIncomeMsgPayload(payload)) return;
      this.removeLocalCategoryListener(payload.category, payload.handlerId);
    }
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalListener(category: string, topic: string, handlerId: string, subscriberHost: string) {
    const wrapper = (payload: any): void => {
      this.response(handlerId, subscriberHost, category, topic, payload);
    };

    this.handlersIndexes[handlerId] = this.system.events.addListener(category, topic, wrapper);
  }

  /**
   * Unsubscribe from local event
   */
  private removeLocalListener(category: string, topic: string, handlerId: string) {
    this.system.events.removeListener(category, topic, this.handlersIndexes[handlerId]);
    delete this.handlersIndexes[handlerId];
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalCategoryListener(category: string, handlerId: string, subscriberHost: string) {
    const wrapper = (payload: any): void => {
      this.response(handlerId, subscriberHost, category, undefined, payload);
    };

    this.handlersIndexes[handlerId] = this.system.events.addCategoryListener(category, wrapper);
  }

  /**
   * Unsubscribe from local event
   */
  private removeLocalCategoryListener(category: string, handlerId: string) {
    this.system.events.removeCategoryListener(category, this.handlersIndexes[handlerId]);
    delete this.handlersIndexes[handlerId];
  }

  private response(
    handlerId: string,
    subscriberHost: string,
    category: string,
    topic: string = ALL_TOPICS,
    payload?: any
  ): void {
    const message: Message = {
      category: categories.messengerBridge,
      topic: RESPOND_TOPIC,
      from: this.system.network.hostId,
      to: subscriberHost,
      payload: {
        category,
        topic: topic,
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
