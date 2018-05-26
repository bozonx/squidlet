import App from './App';
import * as EventEmitter from 'events';

// TODO: generate hash is more safely
let idCounter = 0;


export default class Messenger {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.app = app;
  }

  // TODO: emit and listener remake to listen and publish by categories

  async publish(category: string, topic: string, params: Array<any>) : Promise<void> {
    const fullTopic = this.combineTopic(category, topic);

    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    this.events.emit(fullTopic, params);
  }

  subscribe(category: string, topic: string, handler: (...args: any[]) => void) {
    const fullTopic = this.combineTopic(category, topic);

    this.events.addListener(fullTopic, handler);
  }

  request(category: string, topic: string, params: Array<any>): Promise<any> {
    const messageId: number = this.getNewId();
    const fullTopic = this.combineTopic(category, String(messageId), topic);

    return new Promise((resolve, reject) => {
      this.events.once(fullTopic, (error: string, data: any) => {
        if (error) {
          reject(new Error(error));

          return;
        }

        resolve(data);
      });

      // TODO: ждать таймаут ответа - если не дождались - do reject

      this.events.emit(fullTopic, params);
    });
  }

  listenCategory(category: string, handler: (...args: any[]) => void) {
    // TODO: 11
  }

  private combineTopic(...items: string[]) {
    return items.join('|');
  }

  private getNewId(): number {
    idCounter++;

    return idCounter;
  }
}
