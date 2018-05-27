import App from './App';
//import * as EventEmitter from 'events';
import MessageInterface from './MessageInterface';
import { generateUniqId } from '../helpers/helpres';


export default class Messenger {
  private readonly app: App;
  //private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.app = app;
  }

  /**
   * Send message to specified host.
   * It doesn't wait for respond. But it wait for delivering of message.
   */
  async publish(to: string, category: string, topic: string, payload: any): Promise<void> {
    const message = {
      topic,
      category,
      from: this.app.getHostId(),
      to,
      payload,
    };

    await this.app.router.publish(message);
  }

  /**
   * Listen to messages which was sent by publish method on current on remote host.
   * It omits responds of requests.
   */
  subscribe(category: string, topic: string, handler: (message: MessageInterface) => void) {
    this.app.router.subscribe((message: MessageInterface) => {
      if (message.category !== category || message.topic !== topic) return;
      if (message.request) return;

      if (message.category === category && message.topic === topic) {
        handler(message);
      }
    });
  }

  unsubscribe() {
    // TODO: do it
  }

  request(to: string, category: string, topic: string, payload: any): Promise<any> {
    const message = {
      topic,
      category,
      from: this.app.getHostId(),
      to,
      request: {
        id: generateUniqId(),
        isRequest: true,
      },
      payload,
    };

    return new Promise((resolve, reject) => {

      // TODO: наверное надо отменить если сообщение не будет доставленно

      this.waitForMyMessage(message.request.id)
        .then((response: MessageInterface) => {
          if (response.error) return reject(response.error);

          resolve(response);
        })
        .catch(reject);

      this.app.router.publish(message)
        .catch(reject);
    });
  }

  listenCategory(category: string, handler: (message: MessageInterface) => Promise<any>) {
    const callBack = (message: MessageInterface) => {
      if (message.category !== category) return;

      // TODO: почему ответ здесь делается ????

      handler(message)
        .then((result: any) => {
          if (!message.request) return;

          this.sendRespondMessage(message, result);
        })
        .catch((error) => {
          if (!message.request) {
            this.app.log.error(error);

            return;
          }

          this.sendRespondMessage(message, null, error);
        });
    };

    this.app.router.subscribe(callBack);
  }

  private sendRespondMessage(
    request: MessageInterface,
    payload: any = null,
    error: { message: string, code: number } = undefined
  ) {
    const respondMessage = {
      topic: request.topic,
      category: request.category,
      from: this.app.getHostId(),
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

  private waitForMyMessage(messageId: string): Promise<MessageInterface> {

    // TODO: ждать таймаут ответа - если не дождались - do reject

    return new Promise(((resolve, reject) => {
      const handler = (message: MessageInterface) => {
        if (!message.request || message.request.id !== messageId) return;

        this.app.router.unsubscribe(handler);

        resolve(message);
      };

      this.app.router.subscribe(handler);
    }));
  }

}
