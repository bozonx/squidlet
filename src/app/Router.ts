import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from './App';
import Message from './interfaces/Message';
import Tunnel from './interfaces/Tunnel';
import Destination from './interfaces/Destination';
import { generateTunnelId, findRecursively } from '../helpers/helpers';
import LocalTunnel from '../tunnels/LocalTunnel';
import I2cTunnel from '../tunnels/I2cTunnel';


/**
 * It passes messages to corresponding tunnel by `message.to`.
 * And receives messages from all the available tunnels on current host.
 */
export default class Router {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly tunnels: object = {};
  private readonly eventName: string = 'msg';
  private readonly tunnelTypes: object = {
    local: LocalTunnel,
    i2c: I2cTunnel,
  };

  constructor(app) {
    this.app = app;
  }

  init(): void {
    if (this.app.host.isMaster()) {
      this.configureMasterTunnels();
    }

    // TODO: сделать конфигурирование loopTunnel отдельной ф-ей

    this.configureTunnels();
    this.listenToAllTunnels();
  }

  async publish(message: Message): Promise<void> {
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной
    // TODO: !!! наверное если to = from то отсылать локально???

    const tunnel = this.getTunnel(message.to);

    await tunnel.publish(message);
  }

  subscribe(handler: (message: Message) => void) {
    this.events.addListener(this.eventName, handler);
  }

  unsubscribe(handler: (message: Message) => void) {
    this.events.removeListener(this.eventName, handler);
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
        host: itemPath,
        type: item.address.type,
        //bus: item.address.bus,
        bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
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
      host: this.app.host.getId(),
      type: 'local',
      bus: undefined,
      address: undefined,
    };

    this.registerTunnel(connection);
  }

  private registerTunnel(connection: Destination) {
    const tunnelId = generateTunnelId(connection);
    const TunnelClass = this.tunnelTypes[connection.type];

    this.tunnels[tunnelId] = new TunnelClass(this.app, connection);
    this.tunnels[tunnelId].init();
  }

  private getTunnel(to: Destination): Tunnel {
    const tunnelId = generateTunnelId(to);

    if (!this.tunnels[tunnelId]) {
      throw new Error(`Can't find tunnel "${to}"`);
    }

    return this.tunnels[tunnelId];
  }

  private listenToAllTunnels() {
    _.each(this.tunnels, (tunnel, tunnelId) => {
      const listenCb = (message: Message) => {
        this.events.emit(this.eventName, message);
      };

      tunnel.subscribe(listenCb);
    });
  }

}
