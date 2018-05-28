import App from './App';
import MessageInterface from './interfaces/MessageInterface';

/**
 * It passes messages to corresponding tunnel
 * and receives messages from all the available tunnels.
 */
export default class Router {
  private readonly app: App;

  constructor(app) {
    this.app = app;
  }

  async publish(message: MessageInterface): Promise<void> {
    // TODO: ??? добавить to в message - id компьютера назначения
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: нужно определить куда отослать сообщение в какой туннель
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    const tunnel = this.findTunnel(message.to);

    await tunnel.send();
  }

  subscribe(handler: (message: MessageInterface) => void) {

    // TODO: слушаем сообщения из всех туннелей которое адресованно этому мк
    // TODO: может добавить категорию - тогда будет более оптимально
  }

  unsubscribe(handler: (message: MessageInterface) => void) {
    // TODO: !!!!
  }


  private findTunnel(to: string) {
    // TODO: find!!!! or exception
  }

}
