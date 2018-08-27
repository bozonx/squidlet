const _find = require('lodash/find');
const _capitalize = require('lodash/capitalize');
import * as EventEmitter from 'events';

import Drivers from '../app/Drivers';
import Connection from './interfaces/Connection';
import DriverFactoryBase from '../app/DriverFactoryBase';
import MyAddress from '../app/interfaces/MyAddress';
import Destination from './interfaces/Destination';


type DestHandler = (error: Error | null, payload: any | undefined, fromDest: Destination) => void;


/**
 * Send data to physical address of certain connection and listen fo all the physical addresses.
 * It initializes connection of this host by type and bus and current address of host.
 */
export default class Destinations {
  private readonly drivers: Drivers;
  private readonly events: EventEmitter = new EventEmitter();
  private readonly eventName: string = 'msg';
  private readonly neighbors: {[index: string]: Destination} = {};
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
  listenIncome(handler: DestHandler): void {
    this.events.addListener(this.eventName, handler);
  }

  removeListener(handler: DestHandler): void {
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

    for (let name in this.neighbors) {
      const dest = this.neighbors[name];
      const connectionId: string = this.generateConnectionId(dest);
      const found = _find(this.myAddresses, (item: MyAddress) => {
        return item.type === dest.type && item.bus === dest.bus;
      });

      if (found) result[connectionId] = found;
    }

    return Object.keys(result).map((name) => result[name]);
  }

  private registerConnection(myAddress: MyAddress) {
    const connectionId: string = this.generateConnectionId(myAddress);
    const driverName = this.generateDriverName(myAddress.type);
    const connectionDriver = this.drivers.getDriver<DriverFactoryBase>(driverName);

    this.connections[connectionId] = connectionDriver.getInstance(myAddress) as Connection;
  }

  private listenToAllDestinations(): void {
    for (let name in this.neighbors) {
      const destination = this.neighbors[name];
      const connection = this.getConnection(destination);
      const handler = this.handleIncomeMessages.bind(this, destination);
      connection.listenIncome(destination.address, handler);
    }
  }

  private handleIncomeMessages(fromDest: Destination, error: Error, payload?: any): void {
    this.events.emit(this.eventName, error, payload, fromDest);
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
    return `${_capitalize(connectionType)}.connection.driver`;
  }

}
