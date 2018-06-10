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
  // handlers of local events by handleId
  private readonly handlers: {[index: string]: (payload: any) => void} = {};

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

  private handleIncomeMessages(message: Message): void {
    const {
      category,
      topic,
      from: subscriberHost,
      payload,
    } = message;

    if (category !== this.systemCategory) return;

    if (topic === this.subscribeTopic) {
      this.addLocalListener(subscriberHost, payload.category, payload.topic, payload.handlerId);
    }

    if (topic === this.unsubscribeTopic) {
      this.removeLocalListener();
    }
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalListener(subscriberHost: string, category: string, topic: string, handlerId: string) {
    this.handlers[handlerId] = (payload: any): void => {
      this.sendResponse(category, topic, subscriberHost, handlerId, payload);
    };

    this.system.events.addListener(category, topic, this.handlers[handlerId]);
  }

  private removeLocalListener() {
    // TODO: !!!!!
  }

  private sendResponse(
    category: string,
    topic: string,
    subscriberHost: string,
    handlerId: string,
    payload: any
  ): void {
    const message: Message = {
      category: this.systemCategory,
      topic: this.respondTopic,
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
        // TODO: ????
      });
  }

}
