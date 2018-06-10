import * as _ from 'lodash';
import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import Connection from './interfaces/Connection';
import ConnectionDriver from './interfaces/ConnectionDriver';
import MyAddress from '../app/interfaces/MyAddress';
import Destination from './interfaces/Destination';


/**
 * Send data to physical address of certain connection and listen fo all the physical addresses.
 */
export default class Destinations {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';
  private readonly neighbors: {[index: string]: Destination};
  // addresses by "type-bus"
  private readonly myAddresses: Array<MyAddress>;
  private readonly connections: {[index: string]: Connection} = {};

  constructor(drivers: Drivers, myAddresses: Array<MyAddress>, neighbors: {[index: string]: Destination}) {
    this.drivers = drivers;
    this.neighbors = neighbors;
    this.myAddresses = myAddresses;
  }

  init(): void {
    this.setupConnections();
    this.listenToAllDestinations();
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
  private setupConnections() {
    const myAddresses: Array<MyAddress> = this.collectMyAddresses();

    for(let myAddress of myAddresses) {
      this.registerConnection(myAddress);
    }
  }

  /**
   * Collect all the used connections and deduplicate it.
   */
  private collectMyAddresses(): Array<MyAddress> {
    const result: {[index: string]: MyAddress} = {};

    _.each(this.neighbors, (dest: Destination) => {
      const connectionId: string = this.generateConnectionId(dest);
      const found = _.find(this.myAddresses, (item) => {
        return item.type === dest.type && item.bus === dest.bus;
      });

      if (found) result[connectionId] = found;
    });

    return _.map(result);
  }

  private registerConnection(connectionParams: MyAddress) {
    const connectionId: string = this.generateConnectionId(connectionParams);
    const driverName = this.generateDriverName(connectionParams.type);
    const connectionDriver: ConnectionDriver = this.drivers.getDriver(driverName) as ConnectionDriver;

    this.connections[connectionId] = connectionDriver.getInstance(connectionParams);
  }

  private listenToAllDestinations(): void {
    _.each(this.neighbors, (destination: Destination) => {
      const connection = this.getConnection(destination);
      const handler = this.handleIncomeMessages.bind(this, destination);
      connection.listenIncome(destination.address, handler);
    });
  }

  private handleIncomeMessages(fromDest: Destination, payload: any): void {
    this.events.emit(this.eventName, payload, fromDest);
  }

  private getConnection(destination: Destination): Connection {
    const connectionId = this.generateConnectionId(destination);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private generateConnectionId({ type, bus }: { type: string, bus: string }): string {
    return [ type, bus ].join('-');
  }

  private generateDriverName(connectionType: string): string {
    return `${connectionType}.connection`;
  }

}
