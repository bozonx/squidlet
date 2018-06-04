import * as _ from 'lodash';
import * as EventEmitter from 'events';

import App from './App';
import RouterMessage from './interfaces/RouterMessage';
import Connection from './interfaces/Connection';
import Destination from './interfaces/Destination';
import I2cConnection from '../connections/I2cConnection';


/**
 * It passes messages to corresponding connection by `message.to`.
 * And receives messages from all the available connections on current host.
 * It forwards message to next host if current host one of host on route
 */
export default class Router {
  private readonly app: App;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly connections: { [index: string]: Connection } = {};
  private readonly eventName: string = 'msg';
  private readonly connectionTypes: object = {
    i2c: I2cConnection,
  };

  constructor(app) {
    this.app = app;
  }

  init(): void {
    this.configureConnections();
    this.listenToAllConnections();
  }

  async send(to: string, payload: any): Promise<void> {
    // local messages are forwarded to loop back
    if (to === this.app.host.id) {
      this.sendToLoopBack(payload);

      return;
    }

    // TODO: ждать таймаут ответа - если не дождались - do reject
    // TODO: как-то нужно дождаться что сообщение было доставленно принимающей стороной

    const routerMessage: RouterMessage = this.generateMessage(to, payload);
    const nextHostId: string = this.resolveNextHostId(routerMessage.route);
    const nextHostConnectionParams: Destination = this.resolveHostConnection(nextHostId);
    const connection = this.getConnection(nextHostConnectionParams);

    await connection.send(routerMessage);
  }

  /**
   * Listen for income messages which is delivered to this final host.
   */
  listenIncome(handler: (payload: any) => void) {
    this.events.addListener(this.eventName, handler);
  }

  off(handler: (payload: any) => void) {
    this.events.removeListener(this.eventName, handler);
  }

  /**
   * Configure master to slaves connections.
   */
  private configureMasterConnections() {

    // TODO: use host config - там плоская структура

    // findRecursively(this.app.host.config.devices, (item, itemPath): boolean => {
    //   if (!_.isPlainObject(item)) return false;
    //   // go deeper
    //   if (!item.device) return undefined;
    //   if (item.device !== 'host') return false;
    //
    //   const connection = {
    //     host: itemPath,
    //     type: item.address.type,
    //     //bus: item.address.bus,
    //     bus: (_.isUndefined(item.address.bus)) ? undefined : String(item.address.bus),
    //     address: item.address.address,
    //   };
    //
    //   this.registerConnection(connection);
    //
    //   return false;
    // });
  }

  /**
   * Configure slave to slave and local connections.
   */
  private configureConnections() {
    const connectionTypes = this.collectConnectionTypes(this.app.host.config.neighbors);

    _.each(connectionTypes, (item: { type: string, bus: string }) => {
      this.registerConnection(item);
    });
  }

  private collectConnectionTypes(neighbors: {[index: string]: Destination}): Array<{ type: string, bus: string }> {
    const result = {};

    _.each(neighbors, (item: Destination) => {

      // TODO: test

      const connectionType = _.pick(item, 'type', 'bus');

      result[this.generateConnectionId(connectionType)] = connectionType;
    });

    return _.map(result);
  }

  private registerConnection(connectionType: { type: string, bus: string }) {
    const connectionId = this.generateConnectionId(connectionType);
    const ConnectionClass = this.connectionTypes[connectionType.type];

    this.connections[connectionId] = new ConnectionClass(this.app, connectionType);
    this.connections[connectionId].init();
  }

  generateConnectionId(connection: { type: string, bus: string }): string {
    return [ connection.type, connection.bus ].join('-');
  }

  private getConnection(connectionParams: Destination): Connection {
    const connectionId = this.generateConnectionId(connectionParams);

    // TODO: review

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private listenToAllConnections(): void {
    _.each(this.connections, (connection: Connection) => {
      connection.listenIncome(this.handleIncomeMessages);
    });
  }

  /**
   * Try to find the next host after current.
   * For example we have route [ 'fromHost', 'currentHost', 'nextHost' ]
   *   * first we found current host
   *   * and the next one will be result
   */
  private resolveNextHostId(route: Array<string>): string {
    if (route.length < 2) throw new Error(`Incorrect route ${JSON.stringify(route)}`);
    if (_.last(route) === this.app.host.id) {
      throw new Error(`Incorrect route ${JSON.stringify(route)} current host ${this.app.host.id} is the last`);
    }

    const theNextHostShift = 1;

    // go to next point
    if (route.length === 2) {
      return route[theNextHostShift];
    }

    const myIndex = _.indexOf(route, this.app.host.id);

    if (myIndex < 0) {
      throw new Error(`Can't find my hostId "${this.app.host.id}" in route ${JSON.stringify(route)}`);
    }

    return route[myIndex + theNextHostShift];
  }

  private resolveHostConnection(hostId: string): Destination {
    const params: Destination = this.app.host.config.neighbors[hostId];

    if (!params) throw new Error(`Can't find connection params of host "${hostId}"`);

    return params;
  }

  private handleIncomeMessages = (routerMessage: RouterMessage): void => {
    // if it's final destination - pass message to income listeners
    if (this.app.host.id === _.last(routerMessage.route)) {
      this.events.emit(this.eventName, routerMessage.payload);

      return;
    }

    // else forward message to next host on route

    const nextHostId: string = this.resolveNextHostId(routerMessage.route);
    const nextHostConnectionParams: Destination = this.resolveHostConnection(nextHostId);
    const connection = this.getConnection(nextHostConnectionParams);

    connection.send(routerMessage)
      .catch((err) => {
        // TODO: что делать с ошибкой???
      });
  };

  private generateMessage(to: string, payload: any): RouterMessage {
    if (!this.app.host.config.routes[to]) {
      throw new Error(`Can't find route to "${to}"`);
    }

    const route: Array<string> = this.app.host.config.routes[to];

    return {
      route,
      ttl: this.app.host.config.host.routedMessageTTL,
      payload,
    };
  }

  private sendToLoopBack(payload: any): void {
    this.events.emit(this.eventName, payload);
  }

}
