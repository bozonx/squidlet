import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from './App';
import Message from './interfaces/Message';
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
    // TODO: !!!!
  }

  private resolveHostConnection(hostId: string): Destination {
    // TODO: !!!!
  }

  private handleIncomeMessages = (message: Message) => {

    // TODO: если это промежуточный хост - пересылаем дальше
    // TODO: если это конечный хост - поднимаем событие

    this.events.emit(this.eventName, message);
  };

}
