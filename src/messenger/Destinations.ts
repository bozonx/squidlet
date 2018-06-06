import * as _ from "lodash";
import * as EventEmitter from 'events';

import Drivers from "../app/Drivers";
import Connection from "./interfaces/Connection";
import Destination from "./interfaces/Destination";
import I2cConnection from "./connections/connectionI2c.driver";


interface ConnectionParams {
  type: string,
  bus: string
}

interface ConnectionClass { new (drivers: Drivers, connectionParams: ConnectionParams): Connection }

/**
 * Send data to physical address of certain connection and listen fo all the physical addresses.
 */
export default class Destinations {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';
  private readonly destinationsList: Array<Destination>;
  private readonly connections: { [index: string]: Connection } = {};
  // TODO: use drivers
  private readonly connectionClasses: { [index: string]: ConnectionClass } = {
    i2c: I2cConnection,
  };

  constructor(drivers: Drivers, connectionsParams: Array<Destination>) {
    this.drivers = drivers;
    this.destinationsList = connectionsParams;
  }

  init(): void {
    this.configureConnections();
    this.listenToAllConnections();
  }

  async send(destination: Destination, payload: any): Promise<void> {
    const connection = this.getConnection(destination);

    await connection.send(destination.address, payload);
  }

  /**
   * Listen to all the addresses
   */
  listenIncome(handler: (payload: any, fromDest: Destination) => void): void {
    this.events.addListener(this.eventName, handler);
  }

  removeListener(handler: (payload: any, fromDest: Destination) => void): void {
    this.events.removeListener(this.eventName, handler);
  }

  /**
   * Register all the used connections.
   */
  private configureConnections() {

    // TODO: test

    const connectionClasses = this.collectConnectionsParams(this.destinationsList);

    _.each(connectionClasses, (item: ConnectionParams) => {
      this.registerConnection(item);
    });
  }

  private collectConnectionsParams(neighbors: Array<Destination>): Array<ConnectionParams> {
    const result: {[index: string]: ConnectionParams} = {};

    _.each(neighbors, (item: Destination) => {

      // TODO: test

      const connectionType: ConnectionParams = _.pick(item, 'type', 'bus');
      const connectionId: string = this.generateConnectionId(connectionType);

      result[connectionId] = connectionType;
    });

    return _.map(result);
  }

  private registerConnection(connectionParams: ConnectionParams) {

    // TODO: test

    // TODO: use drivers

    const connectionId: string = this.generateConnectionId(connectionParams);
    const ConnectionClass: ConnectionClass = this.connectionClasses[connectionParams.type];

    this.connections[connectionId] = new ConnectionClass(this.drivers, connectionParams);
    this.connections[connectionId].init();
  }

  private listenToAllConnections(): void {
    _.each(this.destinationsList, (destination: Destination) => {
      const connection = this.getConnection(destination);
      const handler = this.handleIncomeMessages.bind(this, destination);
      connection.listenIncome(destination.address, handler);
    });
  }

  private handleIncomeMessages(fromDest: Destination, payload: any): void {
    this.events.emit(this.eventName, payload, fromDest);
  }

  private getConnection(destination: Destination): Connection {
    const connectionParams: ConnectionParams = _.pick(destination, 'type', 'bus');
    const connectionId = this.generateConnectionId(connectionParams);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private generateConnectionId(connection: { type: string, bus: string }): string {
    return [ connection.type, connection.bus ].join('-');
  }

}
