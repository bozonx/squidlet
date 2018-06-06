import * as _ from "lodash";
import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import Connection from './interfaces/Connection';
import ConnectionDriver from './interfaces/ConnectionDriver';
import ConnectionParams from './interfaces/ConnectionParams';
import Destination from './interfaces/Destination';


/**
 * Send data to physical address of certain connection and listen fo all the physical addresses.
 */
export default class Destinations {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';
  private readonly destinationsList: Array<Destination>;
  private readonly connections: { [index: string]: Connection } = {};

  constructor(
    drivers: Drivers,
    myAddresses: Array<ConnectionParams>,
    destinationsList: Array<Destination>
  ) {
    this.drivers = drivers;
    this.destinationsList = destinationsList;
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

    const connectionParams = this.collectConnectionsParams(this.destinationsList);

    _.each(connectionParams, (item: ConnectionParams) => {
      this.registerConnection(item);
    });
  }

  private collectConnectionsParams(neighbors: Array<Destination>): Array<ConnectionParams> {

    // TODO: нужно брать свой адрес по этому типу и bus

    const result: {[index: string]: ConnectionParams} = {};

    _.each(neighbors, (destination: Destination) => {

      // TODO: test

      const connectionParams: ConnectionParams = this.generateConnectionParams(destination);
      const connectionId: string = this.generateConnectionId(connectionParams);

      result[connectionId] = connectionParams;
    });

    return _.map(result);
  }

  private registerConnection(connectionParams: ConnectionParams) {

    // TODO: test

    const connectionId: string = this.generateConnectionId(connectionParams);
    const driverName = this.generateDriverName(connectionParams.type);
    const connectionDriver: ConnectionDriver = this.drivers.getDriver(driverName) as ConnectionDriver;

    this.connections[connectionId] = connectionDriver.getInstance(connectionParams);
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
    const connectionParams: ConnectionParams = this.generateConnectionParams(destination);
    const connectionId = this.generateConnectionId(connectionParams);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private generateConnectionParams(destination: Destination): ConnectionParams {
    return {
      ..._.pick(destination, 'type', 'bus'),

      // TODO: add srcAddress

      srcAddress: '111111',
    };
  }

  private generateConnectionId(connection: { type: string, bus: string }): string {
    return [ connection.type, connection.bus ].join('-');
  }

  private generateDriverName(connectionType: string): string {
    return `${connectionType}.connection`;
  }

}
