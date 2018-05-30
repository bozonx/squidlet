import * as EventEmitter from 'events';
import App from './App';
import Message from './interfaces/Message';
import Destination from './interfaces/Destination';
import * as helpers from '../helpers/helpers';


/**
 * It's heart of app. It receives and sends messages to router.
 * You can subscribe to all the messages.
 */
export default class Messenger {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  //private readonly _eventName: string = 'msg';
  private subscribers: object = {};

  constructor(app) {
    this.app = app;
  }

  init(): void {
    // this.app.router.subscribe((message: Message): void => {
    //   this.events.emit(this.eventName, message)
    // });
  }

  /**
   * Send message to specified host.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(to: Destination, category: string, topic: string, payload: any): Promise<void> {
    const message = {
      topic,
      category,
      from: this.app.host.generateDestination(to.type, to.bus),
      to,
      payload,
    };

    await this.app.router.publish(message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * It omits responds of requests.
   */
  subscribe(category: string, topic: string, handler: (message: Message) => void) {
    if (!category) throw new Error(`Category can't be an empty`);
    if (!topic) throw new Error(`Topic can't be an empty`);

    const eventName = [ category, topic ].join('|');

    this.events.addListener(eventName, handler);

    // if subscriber is registered - there isn't reason to add additional
    if (this.subscribers[eventName]) return;

    // add new subscriber
    this.subscribers[eventName] = (message: Message): void => {
      if (message.category !== category || message.topic !== topic) return;
      if (message.request) return;

      if (message.category === category && message.topic === topic) {
        //handler(message);
        this.events.emit(eventName, message)
      }
    };

    this.app.router.subscribe(this.subscribers[eventName]);
  }

  unsubscribe(category: string, topic: string, handler: (message: Message) => void) {
    const eventName = [ category, topic ].join('|');

    this.events.removeListener(eventName, handler);

    if (this.events.listeners(eventName).length) return;
    // if there isn't any listeners - remove subscriber
    this.app.router.unsubscribe(this.subscribers[eventName]);
    delete this.subscribers[eventName];
  }

  request(to: Destination, category: string, topic: string, payload: any): Promise<any> {
    const message = {
      topic,
      category,
      from: this.app.host.generateDestination(to.type, to.bus),
      to,
      request: {
        id: helpers.generateUniqId(),
        isRequest: true,
      },
      payload,
    };

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить если сообщение не будет доставленно

      this.waitForMyMessage(message.request.id)
        .then((response: Message) => {
          if (response.error) return reject(response.error);

          resolve(response);
        })
        .catch(reject);

      this.app.router.publish(message)
        .catch(reject);
    });
  }

  listenRequests(category: string, handler: (message: Message) => void) {
    // it will be called on each income message to current host
    const callback = (message: Message) => {
      if (!message.request || message.category !== category) return;

      handler(message);
    };

    this.app.router.subscribe(callback);
  }

  sendRespondMessage(
    request: Message,
    payload: any = null,
    error: { message: string, code: number } = undefined
  ) {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.app.host.generateDestination(request.from.type, request.from.bus),
      to: request.from,
      request: {
        id: request.request.id,
        isResponse: true,
      },
      payload,
      error,
    };

    this.app.router.publish(respondMessage);
  }

  private waitForMyMessage(messageId: string): Promise<Message> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (message: Message) => {
        if (!message.request || message.request.id !== messageId) return;

        this.app.router.unsubscribe(handler);

        resolve(message);
      };

      this.app.router.subscribe(handler);
    }));
  }

}
