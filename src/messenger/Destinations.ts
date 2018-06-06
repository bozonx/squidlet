import * as _ from "lodash";

import Drivers from "../app/Drivers";
import Connection from "./interfaces/Connection";
import Destination from "./interfaces/Destination";
import I2cConnection from "./connections/I2cConnection";


interface ConnectionParams {
  type: string,
  bus: string
}

interface ConnectionClass {new (drivers: Drivers, connectionParams: ConnectionParams): Connection}

/**
 * Send data to physical address of certain connection and listen fo all the physical addresses.
 */
export default class Destinations {
  private readonly drivers: Drivers;
  private readonly destinationsList: Array<Destination>;
  private readonly connections: { [index: string]: Connection } = {};
  private readonly connectionClasses: { [index: string]: ConnectionClass} = {
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
    // TODO: !!!


  }

  listenIncome(handler: (payload: any) => void): void {
    // TODO: !!! слушать со всех хостов сразу

    // this.events.addListener(this.eventName, handler);
  }

  off(handler: (payload: any) => void): void {
    // TODO: !!!

    //this.events.removeListener(this.eventName, handler);
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


  private listenToAllConnections(): void {

    // TODO: слушаем все адреса каждого соединения

    _.each(this.connections, (connection: Connection) => {

      // TODO: add address

      //connection.listenIncome(this.handleIncomeMessages);
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

    const connectionId: string = this.generateConnectionId(connectionParams);
    const ConnectionClass: ConnectionClass = this.connectionClasses[connectionParams.type];

    this.connections[connectionId] = new ConnectionClass(this.drivers, connectionParams);
    this.connections[connectionId].init();
  }

  private getConnection(connectionParams: Destination): Connection {

    // TODO: test

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
