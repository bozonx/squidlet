import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from '../app/App';
import Router from './Router';
import Message from './interfaces/Message';
import * as helpers from '../helpers/helpers';


interface TopicListener {
  category: string;
  topic: string;
  handler: Function;
  wrapper: (...args: Array<any>) => any;
}

/**
 * It's heart of app. It receives and sends messages to router.
 * You can subscribe to all the messages.
 */
export default class Messenger {
  private readonly app: App;
  private readonly router: Router;
  private readonly events: EventEmitter = new EventEmitter();
  //private topicEventNameSeparator: string = '|';
  private topicListeners: Array<TopicListener> = [];

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
      this.addLocalTopicListener(category, topic, handler);

      return;
    }

    // else subscribe to remote host's events
    this.subscribeToRemoteHost(toHost, category, topic, handler);
  }

  /**
   * Listen for local messages of certain category.
   */
  listen(category: string, handler: (message: Message) => void) {
    this.events.addListener(category, handler);
  }

  off(category: string, handler: (message: Message) => void) {
    this.events.removeListener(category, handler);
  }

  /**
   * Unsubscribe of topic of remote or local host.
   * Handler has to be the same as has been specified to "subscribe" method previously
   */
  unsubscribe(
    toHost: string,
    category: string,
    topic: string,
    handler: (message: Message) => void
  ): void {
    const index: number = _.findIndex(this.topicListeners, (item: TopicListener) => {
      return item.category === category && item.topic === topic && item.handler === handler;
    });

    // don't rise error - just exit if hasn't found any
    if (index <= 0) return;

    const topicListener: TopicListener = this.topicListeners[index];
    // remove it
    this.topicListeners.splice(index, 1);

    this.events.removeListener(category, topicListener.wrapper);

    // TODO: !!! отписываться от удаленного хоста

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

          // TODO: сделать

          //if (response.error) return reject(response.error);

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

        this.events.removeListener(category, handler);
        resolve(message);
      };

      this.events.addListener(category, handler);
    }));
  }

  private addLocalTopicListener = (
    category: string,
    topic: string,
    handler: (message: Message) => void
  ) => {
    const wrapper = (message: Message) => {
      if (message.topic === topic) {
        handler(message);
      }
    };

    const topicListener: TopicListener = {
      category,
      topic,
      handler,
      wrapper
    };

    // listen to local events
    this.events.addListener(category, wrapper);
    this.topicListeners.push(topicListener);
  };

  private subscribeToRemoteHost(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {

    // TODO: если задан - делаем спец запрос на подпись события удаленного хоста

  }

  // private getTopicEventName(category: string, topic: string): string {
  //   return [ category, topic ].join(this.topicEventNameSeparator);
  // }

}
