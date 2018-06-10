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
    this.system.network.listenIncome((message: Message): void => {
      // TODO: нужна проверка что это именно сообщение
      this.handleIncomeMessages(message);
    });
  }

  private handleIncomeMessages(message: Message): void {
    if (message.category !== this.systemCategory) return;

    if (message.topic === this.subscribeTopic) {
      this.addLocalListener(message.payload.category, message.payload.topic, message.payload.handlerId);
    }

    if (message.topic === this.unsubscribeTopic) {
      this.removeLocalListener();
    }
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalListener(category: string, topic: string, handlerId: string) {
    // TODO: save handler id

    const handler = (payload: any): void => {
      // TODO: Send response
    };

    this.system.events.addListener(category, topic, handler);

    // TODO: поднимает соответствующие хэндлеры
    // TODO: если пришло сообщение на которое нет подписки - вызвать unsubscribe и писать в лог

  }

  private removeLocalListener() {
    // TODO: !!!!!
  }

}
