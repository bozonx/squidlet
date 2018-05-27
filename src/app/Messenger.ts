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

  async publish(to: string, category: string, topic: string, payload: Array<any>) : Promise<void> {
    const message = {
      topic,
      category,
      from: this.app.getHostId(),
      to,
      payload,
    };

    await this.app.router.publish(message);
  }

  subscribe(category: string, topic: string, handler: (message: MessageInterface) => void) {
    this.app.router.subscribe(((message: MessageInterface) => {
      if (message.category === category && message.topic === topic) {
        handler(message);
      }
    }));
  }

  request(to: string, category: string, topic: string, payload: Array<any>): Promise<any> {
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
      this.app.router.once((response: MessageInterface) => {
        if (response.error) {
          reject(response.error);

          return;
        }

        resolve(response);
      });

      // TODO: ждать таймаут ответа - если не дождались - do reject

      this.app.router.publish(message);
    });
  }

  listenCategory(category: string, handler: (message: MessageInterface) => Promise<any>) {
    const callBack = (message: MessageInterface) => {
      if (message.category !== category) return;

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
        id: generateUniqId(),
        isResponse: true,
      },
      payload,
      error,
    };

    this.app.router.publish(respondMessage);
  }

}
