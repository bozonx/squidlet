import System from '../app/System';
import BridgeSubscriber from './BridgeSubscriber';
import BridgeResponder from './BridgeResponder';
import Message from './interfaces/Message';
import Request from './interfaces/Request';
import {ALL_TOPIC_MASK} from '../app/Events';


/**
 * It receives and sends messages to network.
 * You can subscribe to all the local and remote messages.
 */
export default class Messenger {
  private readonly system: System;
  private readonly bridgeSubscriber: BridgeSubscriber;
  private readonly bridgeResponder: BridgeResponder;

  constructor(system: System) {
    this.system = system;
    this.bridgeSubscriber = new BridgeSubscriber(this.system, this);
    this.bridgeResponder = new BridgeResponder(this.system, this);
  }

  init(): void {
    this.bridgeSubscriber.init();
    this.bridgeResponder.init();

    // listen income messages from remote host and rise them on a local host as local messages
    this.system.network.listenIncome(this.handleIncomeMessages);
  }

  /**
   * Send message to specified host by hostId.
   * This message will rise on remote host as local message
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(toHost: string, category: string, topic: string, payload?: any): Promise<void> {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    const message: Message = {
      category,
      topic,
      from: this.system.network.hostId,
      to: toHost,
      payload,
    };

    await this.sendMessage(message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * If toHost isn't equal to current host - it will subscribe to events of remote host.
   */
  subscribe(toHost: string, category: string, topic: string, handler: (payload: any, message: Message) => void): void {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    const cb = (message: Message) => {
      handler(message.payload, message);
    };

    // TODO: сделать handler - (payload: any, message: Message) => void

    if (toHost === this.system.host.id) {
      // subscribe to local events
      this.system.events.addListener(category, topic, handler);

      return;
    }

    // else subscribe to remote host's events
    this.bridgeSubscriber.subscribe(toHost, category, topic, handler);
  }

  /**
   * Unsubscribe of topic of remote or local host.
   * Handler has to be the same as has been specified to "subscribe" method previously
   */
  unsubscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    if (toHost === this.system.host.id) {
      // subscribe to local events
      this.system.events.removeListener(category, topic, handler);

      return;
    }

    // unsubscribe from remote host's events
    this.bridgeSubscriber.unsubscribe(toHost, category, topic, handler);
  }

  request(toHost: string, category: string, topic: string, payload: any): Promise<any> {
    if (!topic || topic === ALL_TOPIC_MASK) {
      throw new Error(`You have to specify a topic`);
    }

    const request: Request = {
      topic,
      category,
      from: this.system.host.id,
      to: toHost,
      requestId: this.system.io.generateUniqId(),
      isResponse: false,
      payload,
    };

    // TODO: !!!! если локально ???

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить waitForResponse если сообщение не будет доставленно

      this.waitForResponse(request.category, request.requestId)
        .then((response: Request) => {
          if (Number.isInteger(response.errorCode as any) || response.errorMessage) {
            // TODO: review
            reject({
              message: response.errorMessage,
              code: response.errorCode,
            });
          }

          resolve(response);
        })
        .catch(reject);

      // TODO: может через бридж делать???

      this.system.network.send(request.to, request)
        .catch(reject);
    });
  }

  /**
   * Send response of received request.
   */
  async sendResponse(
    request: Request,
    error: { message: string, code: number } | null,
    payload?: any
  ): Promise<void> {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.system.host.id,
      to: request.from,
      requestId: request.requestId,
      isResponse: true,
      payload,
      errorMessage: error && error.message,
      errorCode: error && error.code,
    };

    await this.sendMessage(respondMessage);
  }


  /**
   * Rise all income messages on events
   */
  private handleIncomeMessages = (error: Error | null, message: Message): void => {

    // TODO: наверное исключить системные сообщения???

    // put error to log
    if (error) return this.system.log.error(error.toString());
    if (!message || !message.category || !message.topic) return this.system.log.error(
      `Incorrect message ${JSON.stringify(message)}`
    );

    this.system.events.emit(message.category, message.topic, message);
  }

  private async sendMessage(message: Message): Promise<void> {
    // if message is addressed to local host - rise it immediately
    if (message.to === this.system.host.id) {
      this.system.events.emit(message.category, message.topic, message);

      return;
    }

    await this.system.network.send(message.to, message);
  }

  private waitForResponse(category: string, requestId: string): Promise<Request> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (request: Request) => {
        if (!request.isResponse) return;
        if (request.requestId !== requestId) return;

        // TODO: почему не топика ?????

        this.system.events.removeListener(category, undefined, handler);
        resolve(request);
      };

      this.system.events.addListener(category, undefined, handler);
    }));
  }

}
