import Connection from "./interfaces/Connection";
import I2cConnection from "../connections/I2cConnection";
import Destination from "./interfaces/Destination";
import * as _ from "lodash";


export default class Destinations {
  private readonly connectionsParams: {[index: string]: Destination};
  private readonly connections: { [index: string]: Connection } = {};
  private readonly connectionTypes: object = {
    i2c: I2cConnection,
  };

  constructor(connectionsParams: {[index: string]: Destination}) {
    this.connectionsParams = connectionsParams;
  }

  init(): void {
    // TODO: !!!
  }

  send(destination: Destination, payload: any): Promise<void> {
    // TODO: !!!
  }

  listenIncome(handler: (payload: any) => void): void {
    // TODO: !!!
  }

  off(handler: (payload: any) => void): void {
    // TODO: !!!
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

  private getConnection(connectionParams: Destination): Connection {
    const connectionId = this.generateConnectionId(connectionParams);

    if (!this.connections[connectionId]) {
      throw new Error(`Can't find connection "${connectionId}"`);
    }

    return this.connections[connectionId];
  }

  private listenToAllConnections(): void {
    _.each(this.connections, (connection: Connection) => {

      // TODO: add address

      connection.listenIncome(this.handleIncomeMessages);
    });
  }

  private generateConnectionId(connection: { type: string, bus: string }): string {
    return [ connection.type, connection.bus ].join('-');
  }

}
