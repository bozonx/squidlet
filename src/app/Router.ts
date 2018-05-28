import App from './App';
import MessageInterface from './interfaces/MessageInterface';
import TunnelInterface from './interfaces/TunnelInterface';
import I2cTunnel from '../tunnels/I2cTunnel';

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
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    const tunnel = this.findTunnel(message.to);

    await tunnel.send(message);
  }

  subscribe(handler: (message: MessageInterface) => void) {

    // TODO: слушаем сообщения из всех туннелей которое адресованно этому мк
    // TODO: может добавить категорию - тогда будет более оптимально
    // TODO: лушче сразу подписаться на все туннели и поднимать событие на те на которые подписанны в subscribe
  }

  unsubscribe(handler: (message: MessageInterface) => void) {
    // TODO: !!!!
  }


  private findTunnel(to: string): TunnelInterface {
    // TODO: find!!!! or exception
    // TODO: нужно определить куда отослать сообщение в какой туннель
  }

}
