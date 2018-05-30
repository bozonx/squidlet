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
  private readonly _events: EventEmitter = new EventEmitter();
  private readonly _tunnels: object = {};
  private readonly _tunnelTypes: object = {
    local: LocalTunnel,
    i2c: I2cTunnel,
  };
  private readonly _eventName: string = 'msg';

  constructor(app) {
    this.app = app;
  }

  init(): void {
    if (this.app.host.isMaster()) {
      this.configureMasterTunnels();
    }

    this.configureTunnels();
    this.listenToAllTunnels();
  }

  async publish(message: Message): Promise<void> {
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной
    // TODO: !!! наверное если to = from то отсылать локально???

    const tunnel = this._getTunnel(message.to);

    await tunnel.publish(message);
  }

  subscribe(handler: (message: Message) => void) {
    this._events.addListener(this._eventName, handler);
  }

  unsubscribe(handler: (message: Message) => void) {
    this._events.removeListener(this._eventName, handler);
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
    const TunnelClass = this._tunnelTypes[connection.type];

    this._tunnels[tunnelId] = new TunnelClass(this.app, connection);
    this._tunnels[tunnelId].init();
  }

  private _getTunnel(to: Destination): Tunnel {
    const tunnelId = generateTunnelId(to);

    if (!this._tunnels[tunnelId]) {
      throw new Error(`Can't find tunnel "${to}"`);
    }

    return this._tunnels[tunnelId];
  }

  private listenToAllTunnels() {
    _.each(this._tunnels, (tunnel, tunnelId) => {
      const listenCb = (message: Message) => {
        this._events.emit(this._eventName, message);
      };

      tunnel.subscribe(listenCb);
    });
  }

}
