import * as _ from 'lodash';
import App from './App';
import MessageInterface from './interfaces/MessageInterface';
import TunnelInterface from './interfaces/TunnelInterface';
import ConnectionInterface from './interfaces/ConnectionInterface';
import { generateTunnelId, findRecursively } from '../helpers/helpres';
import I2cTunnel from '../tunnels/I2cTunnel';
//import * as EventEmitter from 'events';


/**
 * It passes messages to corresponding tunnel
 * and receives messages from all the available tunnels.
 */
export default class Router {
  private readonly app: App;
  private readonly tunnels: object;
  private readonly tunnelTypes: object = {
    i2c: I2cTunnel,
  };
  //private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.app = app;

    if (this.app.isMaster()) {
      this.configureMasterTunnels();
    }
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


  private configureMasterTunnels() {
    findRecursively(this.app.config.devices, (item, itemPath) => {
      if (!_.isPlainObject(item)) return false;
      // go deeper
      if (!item.device) return undefined;
      if (item.device !== 'host') return false;

      const connection = {
        hostId: itemPath,
        type: item.address.type,
        bus: item.address.bus,
        address: item.address.address,
      };

      this.registerTunnel(connection);

      return false;
    });
  }

  private registerTunnel(connection: ConnectionInterface) {
    const tunnelId = generateTunnelId(connection);
    const TunnelClass = this.tunnelTypes[connection.type];

    this.tunnels[tunnelId] = new TunnelClass(connection);
  }

  private findTunnel(to: string): TunnelInterface {

    // TODO: точто to будет tunnel id ???

    if (!this.tunnels[to]) {
      throw new Error(`Can't find tunnel "${to}"`);
    }

    return this.tunnels[to];
  }

}
