import * as EventEmitter from 'events';

import App from './App';
import Router from './Router';
import Message from './interfaces/Message';
import * as helpers from '../helpers/helpers';


/**
 * It's heart of app. It receives and sends messages to router.
 * You can subscribe to all the messages.
 */
export default class Messenger {
  private readonly app: App;
  readonly router: Router;
  private readonly events: EventEmitter = new EventEmitter();
  private subscribers: object = {};

  constructor(app: App) {
    this.app = app;
    this.router = new Router(app);
  }

  init(): void {
    this.router.init();

    // listen income messages from remote host and rise them on a local host as local messages
    this.router.listenIncome((message: Message): void => {
      this.events.emit(message.category, message);
    });
  }

  /**
   * Send message to specified host by hostId.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(toHost: string, category: string, topic: string, payload: any | undefined): Promise<void> {
    const message: Message = {
      category,
      topic,
      from: this.app.host.id,
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
    if (toHost === this.app.host.id) {
      // subscribe to local events
      this.addTopicListener(category, topic, handler);

      return;
    }

    // else subscribe to remote host's events
    this.subscribeToRemoteHost(toHost, category, topic, handler);
  }

  /**
   * Listen for local messages of certain category.
   */
  listen(category: string, handler: (message: Message) => void) {
    // it will be called on each income message to current host
    const callback = (message: Message) => {
      if (!message.isRequest) return;

      handler(message);
    };

    this.events.addListener(category, callback);
  }

  unsubscribe(category: string, topic: string, handler: (message: Message) => void): void {

    // TODO: review
    // TODO: добавить toHost

    // TODO: найти topic listener и отписаться

    // this.events.removeListener(eventName, handler);
    //
    // if (this.events.listeners(eventName).length) return;
    //
    // // if there isn't any listeners - remove subscriber
    // this.router.off(this.subscribers[eventName]);
    // delete this.subscribers[eventName];
  }

  request(toHost: string, category: string, topic: string, payload: any): Promise<any> {
    const message = {
      topic,
      category,
      from: this.app.host.id,
      to: toHost,
      requestId: helpers.generateUniqId(),
      isRequest: true,
      payload,
    };

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить waitForResponse если сообщение не будет доставленно

      this.waitForResponse(message.category, message.requestId)
        .then((response: Message) => {
          if (response.error) return reject(response.error);

          resolve(response);
        })
        .catch(reject);

      this.router.send(message.to, message)
        .catch(reject);
    });
  }

  /**
   * Send response of received request.
   */
  async sendResponse(
    request: Message,
    payload: any = null,
    error: { message: string, code: number } | undefined = undefined
  ): Promise<void> {

    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.app.host.id,
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
    if (message.to === this.app.host.id) {
      this.events.emit(message.category, message);

      return;
    }

    await this.router.send(message.to, message);
  }

  private waitForResponse(category: string, requestId: string): Promise<Message> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (message: Message) => {
        if (!message.isResponse) return;
        if (message.requestId !== requestId) return;

        //this.router.off(handler);
        // TODO: проверить что удалиться
        this.events.removeListener(category, handler);

        resolve(message);
      };

      //this.router.listenIncome(handler);
      this.events.addListener(category, handler);
    }));
  }

  private addSubscriber(eventName: string, category: string, topic: string) {

    // TODO: review

    // // if subscriber is registered - there isn't reason to add additional
    // if (this.subscribers[eventName]) return;
    //
    // // add new subscriber
    // this.subscribers[eventName] = (message: Message): void => {
    //   if (message.category !== category || message.topic !== topic) return;
    //   if (message.request) return;
    //
    //   if (message.category === category && message.topic === topic) {
    //     //handler(message);
    //     this.events.emit(eventName, message)
    //   }
    // };
    //
    // this.router.listenIncome(this.subscribers[eventName]);
  }

  private subscribeToRemoteHost(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {

    // TODO: если задан - делаем спец запрос на подпись события удаленного хоста

  }


  private addTopicListener = (category: string, topic: string, handler: (message: Message) => void) => {
    const cb = (message: Message) => {
      if (message.topic === topic) {
        handler(message);
      }
    };

    // listen to local events
    this.events.addListener(category, cb);

    // TODO: зачем ????
    // add subscriber to router if need
    //this.addSubscriber(eventName, category, topic);

  };


  // private getEventName(category: string, topic: string): string {
  //   return [ category, topic ].join(this.eventNameSeparator);
  // }

}
