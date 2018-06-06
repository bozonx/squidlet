import * as _ from "lodash";
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
  // addresses by "type-bus"
  private readonly myAddresses: {[index: string]: MyAddress} = {};
  private readonly destinationsList: Array<Destination>;
  private readonly connections: { [index: string]: Connection } = {};

  constructor(
    drivers: Drivers,
    myAddresses: Array<MyAddress>,
    destinationsList: Array<Destination>
  ) {
    this.drivers = drivers;

    // TODO: получить адреса

    _.each(myAddresses, (addr: MyAddress): void => {
      this.myAddresses[this.generateConnectionId(addr)] = addr;
    });

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

    _.each(connectionParams, (item: MyAddress) => {
      this.registerConnection(item);
    });
  }

  private collectConnectionsParams(neighbors: Array<Destination>): Array<MyAddress> {

    // TODO: нужно брать свой адрес по этому типу и bus

    const result: {[index: string]: MyAddress} = {};

    _.each(neighbors, (destination: Destination) => {

      // TODO: test

      const connectionParams: MyAddress = this.generateConnectionParams(destination);
      const connectionId: string = this.generateConnectionId(connectionParams);

      result[connectionId] = connectionParams;
    });

    return _.map(result);
  }

  private registerConnection(connectionParams: MyAddress) {

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
    const connectionParams: MyAddress = this.generateConnectionParams(destination);
    const connectionId = this.generateConnectionId(connectionParams);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private generateConnectionParams({ type, bus }: { type: string, bus: string }): MyAddress {
    const connectionId = this.generateConnectionId({ type, bus });
    const myAddr = this.myAddresses[connectionId];

    if (!myAddr) throw new Error(`Can't get address of "${JSON.stringify({ type, bus })}"`);

    return {
      type,
      bus,
      address: myAddr.address,
    };
  }

  private generateConnectionId({ type, bus }: { type: string, bus: string }): string {
    return [ type, bus ].join('-');
  }

  private generateDriverName(connectionType: string): string {
    return `${connectionType}.connection`;
  }

}
