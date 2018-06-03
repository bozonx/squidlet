import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from './App';
import Message from './interfaces/Message';
import RouterMessage from './interfaces/RouterMessage';
import Connection from './interfaces/Connection';
import Destination from './interfaces/Destination';
import { generateConnectionId, findRecursively } from '../helpers/helpers';
import LocalConnection from '../connections/LocalConnection';
import I2cConnection from '../connections/I2cConnection';


/**
 * It passes messages to corresponding connection by `message.to`.
 * And receives messages from all the available connections on current host.
 * It forwards message to next host if current host one of host on route
 */
export default class Router {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connections: object = {};
  private readonly eventName: string = 'msg';
  private readonly connectionTypes: object = {
    local: LocalConnection,
    i2c: I2cConnection,
  };

  constructor(app) {
    this.app = app;
  }

  init(): void {
    if (this.app.host.isMaster) {
      this.configureMasterConnections();
    }

    // TODO: сделать конфигурирование loopConnection отдельной ф-ей

    this.configureConnections();
    this.listenToAllConnections();
  }

  async publish(message: Message): Promise<void> {
    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной
    // TODO: !!! наверное если to = from то отсылать локально???


    // TODO: !!! сформировать route message - RouterMessage
    // TODO: !!! сформировать route
    // TODO: !!! сформировать from - from: this.app.host.id,

    const nextHostId: string = this.resolveNextHostId(message);
    const nextHostConnectionParams: Destination = this.resolveHostConnection(nextHostId);
    const connection = this.getConnection(nextHostConnectionParams);

    await connection.publish(message);
  }

  /**
   * Listen for messeges which is delivered to this final host.
   */
  subscribe(handler: (message: Message) => void) {
    this.events.addListener(this.eventName, handler);
  }

  unsubscribe(handler: (message: Message) => void) {
    this.events.removeListener(this.eventName, handler);
  }

  /**
   * Configure master to slaves connections.
   */
  private configureMasterConnections() {

    // TODO: use host config - там плоская структура

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

      this.registerConnection(connection);

      return false;
    });
  }

  /**
   * Configure slave to slave and local connections.
   */
  private configureConnections() {
    const connection = {
      host: this.app.host.id,
      type: 'local',
      bus: undefined,
      address: undefined,
    };

    this.registerConnection(connection);
  }

  private registerConnection(connection: Destination) {
    const connectionId = generateConnectionId(connection);
    const ConnectionClass = this.connectionTypes[connection.type];

    this.connections[connectionId] = new ConnectionClass(this.app, connection);
    this.connections[connectionId].init();
  }

  private getConnection(to: Destination): Connection {
    const connectionId = generateConnectionId(to);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${to}"`);
    }

    return this.connections[connectionId];
  }

  private listenToAllConnections() {
    _.each(this.connections, (connection, connectionId) => {
      connection.subscribe(this.handleIncomeMessages);
    });
  }

  private resolveNextHostId(message: Message): string {
    // the next is "to" if route is empty
    if (_.isEmpty(message.route)) return message.to;

    const route = [ ...message.route, message.to ];
    const myIndex = _.indexOf(route, this.app.host.id);
    const theNextHostShift = 1;

    if (myIndex < 0) {
      throw new Error(`Can't find my hostId "${this.app.host.id}" in route ${JSON.stringify(route)}`);
    }
    if ((route.length - theNextHostShift) <= myIndex) {
      throw new Error(`Can't find the next host in route ${JSON.stringify(route)}`);
    }

    return route[myIndex + theNextHostShift];
  }

  private resolveHostConnection(hostId: string): Destination {
    const params: Destination = this.app.host.config.neighbors[hostId];

    if (!params) throw new Error(`Can't find connection params of host "${hostId}"`);

    return params;
  }

  private handleIncomeMessages = (message: Message): void => {
    // if it's final destination - pass message to messenger
    if (this.app.host.id === message.to) {
      this.events.emit(this.eventName, message);

      return;
    }

    // else forward message to next host on route

    // TODO: проверить правильно ли вызывать publish - или сделать все самому?

    this.publish(message);
  };

}
