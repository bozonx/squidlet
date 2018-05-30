import * as _ from 'lodash';
import * as EventEmitter from 'events';
import App from './App';
import MessageInterface from './interfaces/MessageInterface';
import TunnelInterface from './interfaces/TunnelInterface';
import AddressInterface from './interfaces/AddressInterface';
import { generateTunnelId, findRecursively } from '../helpers/helpers';
import LocalTunnel from '../tunnels/LocalTunnel';
import I2cTunnel from '../tunnels/I2cTunnel';


/**
 * It passes messages to corresponding tunnel
 * and receives messages from all the available tunnels.
 */
export default class Router {
  private readonly _app: App;
  private readonly _events: EventEmitter = new EventEmitter();
  private readonly _tunnels: object;
  private readonly _tunnelTypes: object = {
    local: LocalTunnel,
    i2c: I2cTunnel,
  };
  private readonly _eventName: 'msg';

  constructor(app) {
    this._app = app;
  }

  init() {
    if (this._app.isMaster()) {
      this._configureMasterTunnels();
    }

    this._configureTunnels();
    this._listenToAllTunnels();
  }

  async publish(message: MessageInterface): Promise<void> {
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной
    // TODO: !!! наверное если to = from то отсылать локально???

    const tunnel = this._getTunnel(message.to);

    await tunnel.publish(message);
  }

  subscribe(handler: (message: MessageInterface) => void) {
    this._events.on(this._eventName, handler);
  }

  unsubscribe(handler: (message: MessageInterface) => void) {
    this._events.off(this._eventName, handler);
  }

  getHostId(): string {

    // TODO: return id of current host - master or room.hostName

    return 'master';
  }

  getMyAddress(type: string, bus: string): string {

    // TODO: получить текущий адрес хоста

    return ''
  }

  /**
   * Configure master to slaves tunnels.
   */
  private _configureMasterTunnels() {
    findRecursively(this._app.config.devices, (item, itemPath): boolean => {
      if (!_.isPlainObject(item)) return false;
      // go deeper
      if (!item.device) return undefined;
      if (item.device !== 'host') return false;

      const connection = {
        hostId: itemPath,
        type: item.address.type,
        //bus: item.address.bus,
        bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
        address: item.address.address,
      };

      this._registerTunnel(connection);

      return false;
    });
  }

  /**
   * Configure slave to slave and local tunnels.
   */
  private _configureTunnels() {
    const connection = {
      hostId: this.getHostId(),
      type: 'local',
      bus: undefined,
      address: undefined,
    };

    this._registerTunnel(connection);
  }

  private _registerTunnel(connection: AddressInterface) {
    const tunnelId = generateTunnelId(connection);
    const TunnelClass = this._tunnelTypes[connection.type];

    this._tunnels[tunnelId] = new TunnelClass(this._app, connection);
    this._tunnels[tunnelId].init();
  }

  private _getTunnel(to: AddressInterface): TunnelInterface {
    const tunnelId = generateTunnelId(to);

    if (!this._tunnels[tunnelId]) {
      throw new Error(`Can't find tunnel "${to}"`);
    }

    return this._tunnels[tunnelId];
  }

  private _listenToAllTunnels() {
    _.each(this._tunnels, (tunnel, tunnelId) => {
      const listenCb = (message: MessageInterface) => {
        this._events.emit(this._eventName, message);
      };

      tunnel.subscribe(listenCb);
    });
  }

}
