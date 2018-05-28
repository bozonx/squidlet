import * as _ from 'lodash';
import App from './App';
import MessageInterface from './interfaces/MessageInterface';
import TunnelInterface from './interfaces/TunnelInterface';
import AddressInterface from './interfaces/AddressInterface';
import { generateTunnelId, findRecursively } from '../helpers/helpres';
import LocalTunnel from '../tunnels/LocalTunnel';
import I2cTunnel from '../tunnels/I2cTunnel';
import * as EventEmitter from 'events';


/**
 * It passes messages to corresponding tunnel
 * and receives messages from all the available tunnels.
 */
export default class Router {
  private readonly app: App;
  private readonly tunnels: object;
  private readonly tunnelTypes: object = {
    local: LocalTunnel,
    i2c: I2cTunnel,
  };
  private readonly events: EventEmitter = new EventEmitter();

  constructor(app) {
    this.app = app;

    if (this.app.isMaster()) {
      this.configureMasterTunnels();
    }

    this.configureTunnels();

    this.listenToAllTunnels();
  }

  async publish(message: MessageInterface): Promise<void> {
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    // TODO: !!! что по части локальныйх запросов ???
    // TODO: !!! наверное если to = from то отсылать локально???

    const tunnel = this.getTunnel(message.to);

    await tunnel.publish(message);
  }

  subscribe(handler: (message: MessageInterface) => void) {
    this.events.on('tunnelMsg', handler);
  }

  unsubscribe(handler: (message: MessageInterface) => void) {
    this.events.off('tunnelMsg', handler);
  }


  /**
   * Configure master to slaves tunnels.
   */
  private configureMasterTunnels() {
    findRecursively(this.app.config.devices, (item, itemPath): boolean => {
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

  /**
   * Configure slave to slave and local tunnels.
   */
  private configureTunnels() {
    const connection = {
      hostId: this.app.getHostId(),
      type: 'local',
      bus: undefined,
      address: undefined,
    };

    this.registerTunnel(connection);
  }

  private registerTunnel(connection: AddressInterface) {
    const tunnelId = generateTunnelId(connection);
    const TunnelClass = this.tunnelTypes[connection.type];

    this.tunnels[tunnelId] = new TunnelClass(this.app, connection);
  }

  private getTunnel(to: string): TunnelInterface {

    // TODO: точно to будет tunnel id ???

    if (!this.tunnels[to]) {
      throw new Error(`Can't find tunnel "${to}"`);
    }

    return this.tunnels[to];
  }

  private listenToAllTunnels() {
    _.each(this.tunnels, (tunnel, tunnelId) => {
      const listenCb = (message: MessageInterface) => {
        this.events.emit('tunnelMsg', message);
      };

      tunnel.subscribe(listenCb);
    });
  }

}
