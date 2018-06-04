import * as EventEmitter from 'events';
import App from './App';
import Message from './interfaces/Message';
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
  async publish(to: string, category: string, topic: string, payload: any): Promise<void> {
    const message = {
      topic,
      category,
      from: this.app.host.id,
      to,
      payload,
    };

    await this.app.router.send(message.to, message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * It omits responds of requests.
   */
  subscribe(category: string, topic: string, handler: (message: Message) => void) {
    if (!category) throw new Error(`Category can't be an empty`);
    if (!topic) throw new Error(`Topic can't be an empty`);

    const eventName = [ category, topic ].join('|');

    // listen to event of "cat|topic"
    this.events.addListener(eventName, handler);
    // add subscriber to router if need
    this.addSubscriber(eventName, category, topic);
  }

  unsubscribe(category: string, topic: string, handler: (message: Message) => void) {
    if (!category) throw new Error(`Category can't be an empty`);
    if (!topic) throw new Error(`Topic can't be an empty`);

    const eventName = [ category, topic ].join('|');

    this.events.removeListener(eventName, handler);

    if (this.events.listeners(eventName).length) return;

    // if there isn't any listeners - remove subscriber
    this.app.router.off(this.subscribers[eventName]);
    delete this.subscribers[eventName];
  }

  request(to: string, category: string, topic: string, payload: any): Promise<any> {
    if (!category) throw new Error(`Category can't be an empty`);
    if (!topic) throw new Error(`Topic can't be an empty`);

    const message = {
      topic,
      category,
      from: this.app.host.id,
      to,
      request: {
        id: helpers.generateUniqId(),
        isRequest: true,
      },
      payload,
    };

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить waitForResponse если сообщение не будет доставленно

      this.waitForResponse(message.request.id)
        .then((response: Message) => {
          if (response.error) return reject(response.error);

          resolve(response);
        })
        .catch(reject);

      this.app.router.publish(message.to, message)
        .catch(reject);
    });
  }

  /**
   * Listen for income requests by category
   */
  listenIncomeRequests(category: string, handler: (message: Message) => void) {
    // it will be called on each income message to current host
    const callback = (message: Message) => {
      if (!message.request || !message.request.isRequest || message.category !== category) return;

      handler(message);
    };

    this.app.router.listenIncome(callback);
  }

  /**
   * Send response of received request.
   */
  sendResponse(
    request: Message,
    payload: any = null,
    error: { message: string, code: number } = undefined
  ): Promise<void> {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.app.host.id,
      to: request.from,
      request: {
        id: request.request.id,
        isResponse: true,
      },
      payload,
      error,
    };

    return this.app.router.send(respondMessage.to, respondMessage);
  }

  private waitForResponse(messageId: string): Promise<Message> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (message: Message) => {
        if (!message.request) return;
        if (!message.request.isResponse) return;
        if (message.request.id !== messageId) return;

        this.app.router.off(handler);

        resolve(message);
      };

      this.app.router.listenIncome(handler);
    }));
  }

  private addSubscriber(eventName: string, category: string, topic: string) {
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

    this.app.router.listenIncome(this.subscribers[eventName]);
  }

}
