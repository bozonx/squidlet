import App from './App';
import * as EventEmitter from 'events';


export default class Messenger {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.app = app;
  }

  async publish(category: string, topic: string, params: object) : Promise<void> {
    const fullTopic = this.combineTopic(category, topic);

    this.events.emit(fullTopic, params);
  }

  subscribe(category: string, topic: string, handler: (...args: any[]) => void) {
    const fullTopic = this.combineTopic(category, topic);

    this.events.addListener(fullTopic, handler);
  }


  private combineTopic(category: string, topic: string) {
    return `${category}|${topic}`;
  }

}
