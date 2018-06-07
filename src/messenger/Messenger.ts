import App from '../app/App';
import Router from './Router';
import Bridge from './Bridge';
import Message from './interfaces/Message';
import Request from './interfaces/Request';
import { generateUniqId } from '../helpers/helpers';


/**
 * It's heart of app. It receives and sends messages to router.
 * You can subscribe to all the messages.
 */
export default class Messenger {
  readonly router: Router;
  private readonly app: App;
  private readonly bridge: Bridge;

  constructor(app: App) {
    this.app = app;
    this.router = new Router(app);
    this.bridge = new Bridge(app, this);
  }

  init(): void {
    this.router.init();
    this.bridge.init();

    // listen income messages from remote host and rise them on a local host as local messages
    this.router.listenIncome((message: Message): void => {
      this.app.events.emit(message.category, message.topic, message);
    });
  }

  /**
   * Send message to specified host by hostId.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(toHost: string, category: string, topic: string, payload: any | undefined): Promise<void> {
    if (!topic || topic === this.app.events.allTopicsMask) {
      throw new Error(`You have to specify a topic`);
    }

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
    if (!topic || topic === this.app.events.allTopicsMask) {
      throw new Error(`You have to specify a topic`);
    }

    if (toHost === this.app.host.id) {
      // subscribe to local events
      this.app.events.addListener(category, topic, handler);

      return;
    }

    // else subscribe to remote host's events
    this.bridge.subscribe(toHost, category, topic, handler);
  }

  /**
   * Unsubscribe of topic of remote or local host.
   * Handler has to be the same as has been specified to "subscribe" method previously
   */
  unsubscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    if (toHost === this.app.host.id) {
      // subscribe to local events
      this.app.events.removeListener(category, topic, handler);

      return;
    }

    // unsubscribe from remote host's events
    this.bridge.unsubscribe(toHost, category, topic, handler);
  }

  request(toHost: string, category: string, topic: string, payload: any): Promise<any> {
    if (!topic || topic === this.app.events.allTopicsMask) {
      throw new Error(`You have to specify a topic`);
    }

    const message = {
      topic,
      category,
      from: this.app.host.id,
      to: toHost,
      requestId: generateUniqId(),
      isRequest: true,
      payload,
    };

    // TODO: !!!! если локально ???

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
      this.app.events.emit(message.category, message.topic, message);

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

        // TODO: почему не топика ?????

        this.app.events.removeListener(category, undefined, handler);
        resolve(message);
      };

      this.app.events.addListener(category, undefined, handler);
    }));
  }

}
