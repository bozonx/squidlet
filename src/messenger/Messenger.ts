import System from '../app/System';
import BridgeSubscriber from './BridgeSubscriber';
import BridgeResponder from './BridgeResponder';
import Message from './interfaces/Message';
import Request from './interfaces/Request';


/**
 * It's heart of app. It receives and sends messages to network.
 * You can subscribe to all the messages.
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
    this.system.network.listenIncome((error: Error | null, message: Message): void => {
      if (error) {
        // TODO: что делать в случае ошибки - наверное в лог писать или сделать message.error ???
        this.system.log.error(error.toString());

        return;
      }

      // TODO: нужна проверка что это именно сообщение
      this.system.events.emit(message.category, message.topic, message);
    });
  }

  /**
   * Send message to specified host by hostId.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(toHost: string, category: string, topic: string, payload: any | undefined): Promise<void> {
    if (!topic || topic === this.system.events.allTopicsMask) {
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
  subscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    if (!topic || topic === this.system.events.allTopicsMask) {
      throw new Error(`You have to specify a topic`);
    }

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
    if (!topic || topic === this.system.events.allTopicsMask) {
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
    payload: any = null,
    error: { message: string, code: number } | undefined = undefined
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
