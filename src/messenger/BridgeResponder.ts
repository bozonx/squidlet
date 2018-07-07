import System from '../app/System';
import Messenger, {SYSTEM_CATEGORY} from './Messenger';
import Message from './interfaces/Message';


/**
 * Subscribe to remote host's events
 */
export default class Bridge {
  private readonly system: System;
  private readonly messenger: Messenger;

  // TODO: make consts
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

  private handleIncomeMessages(message: Message): void {
    const {
      category,
      topic,
      from: subscriberHost,
      payload,
    } = message;

    if (category !== SYSTEM_CATEGORY) return;

    if (topic === this.subscribeTopic) {
      this.addLocalListener(payload.category, payload.topic, payload.handlerId, subscriberHost);
    }

    if (topic === this.unsubscribeTopic) {
      this.removeLocalListener(payload.category, payload.topic, payload.handlerId);
    }
  }

  /**
   * Subscribe to local event and send message to remote subscriber
   */
  private addLocalListener(category: string, topic: string, handlerId: string, subscriberHost: string) {
    this.handlers[handlerId] = (payload: any): void => {
      this.response(category, topic, subscriberHost, handlerId, payload);
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
    category: string,
    topic: string,
    subscriberHost: string,
    handlerId: string,
    payload: any
  ): void {
    const message: Message = {
      category: SYSTEM_CATEGORY,
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
