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

  async publish(to: string, category: string, topic: string, params: Array<any>) : Promise<void> {
    // const fullTopic = this.combineTopic(category, topic);
    // this.events.emit(fullTopic, params);

    const message = {
      topic,
      category,
      payload: params,
      from: this.app.getHostId(),
      to,
    };

    await this.app.router.publish(message);
  }

  subscribe(category: string, topic: string, handler: (message: MessageInterface) => void) {
    // const fullTopic = this.combineTopic(category, topic);
    // this.events.addListener(fullTopic, handler);

    this.app.router.subscribe(((message: MessageInterface) => {
      if (message.category === category) {
        handler(message);
      }
    }));
  }

  request(to: string, category: string, topic: string, params: Array<any>): Promise<any> {
    const message = {
      topic,
      category,
      payload: params,
      from: this.app.getHostId(),
      to,
      request: {
        id: generateUniqId(),
        isRequest: true,
      },
    };

    //const fullTopic = this.combineTopic(category, String(messageId), topic);

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

  // listenCategory(category: string, handler: (...args: any[]) => void) {
  //   // TODO: 11
  // }

}
