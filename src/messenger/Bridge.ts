import App from '../app/App';
import Messenger from './Messenger';
import Router from './Router';
import Message from './interfaces/Message';
import { generateEventName, generateUniqId } from '../helpers/helpers';


interface HandlerItem {
  handlerId: string,
  handler: Function,
}

/**
 * Subscribe to remote host's events
 */
export default class Bridge {
  private readonly app: App;
  private readonly messenger: Messenger;
  private readonly router: Router;
  private readonly systemCategory: string = 'system';
  private readonly subscribeTopic: string = 'subscribeToRemoteEvent';
  private readonly unsubscribeTopic: string = 'unsubscribeFromRemoteEvent';
  // handlers of remote events by "toHost-category-topic"
  private readonly handlers: {[index: string]: Array<HandlerItem>} = {};

  constructor(app: App, messenger: Messenger) {
    this.app = app;
    this.messenger = messenger;
    this.router = this.messenger.router;
  }

  init(): void {
    // TODO: listen router income
  }

  publish(toHost: string, category: string, topic: string, payload: any | undefined): Promise<void> {
    // TODO: publish тоже можно сюда переденсти

  }

  subscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    const eventName = this.generateEventName(toHost, category, topic);
    const handlerId: string = generateUniqId();
    const message: Message = {
      category: this.systemCategory,
      topic: this.subscribeTopic,
      // TODO: поидее не обязательно указывать - нужно только для реквестов
      from: this.app.host.id,
      to: toHost,
      payload: handlerId,
    };
    const handlerItem: HandlerItem = {
      handlerId,
      handler,
    };

    // register listener
    this.handlers[eventName].push(handlerItem);

    this.messenger.router.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }

  unsubscribe(toHost: string, category: string, topic: string, handler: (message: Message) => void): void {
    const eventName = this.generateEventName(toHost, category, topic);
    const handlerId = this.findHandlerId(eventName, handler);
    const message: Message = {
      category: this.systemCategory,
      topic: this.unsubscribeTopic,
      // TODO: поидее не обязательно указывать - нужно только для реквестов
      from: this.app.host.id,
      to: toHost,
      payload: handlerId,
    };

    this.removeHandler(eventName, handler);

    this.messenger.router.send(toHost, message)
      .catch((err) => {
        // TODO: ожидать ответа - если не дошло - наверное повторить
      });
  }


  private listenIncomeMessages() {
    // TODO: слушаем входящие сервисные сообщения
    // TODO: поднимает соответствующие хэндлеры
    // TODO: если пришло сообщение на которое нет подписки - вызвать unsubscribe и писать в лог

  }

  private generateEventName(toHost: string, category: string, topic: string): string {
    const eventName = generateEventName(category, topic);

    // TODO: !!!!
  }

  private findHandlerId(eventName: string, handler: Function): HandlerItem {
    // TODO: !!!!
  }

  private removeHandler(eventName: string, handler: Function): void {
    // TODO: !!!!
    delete this.handlers[eventName];
  }

}
