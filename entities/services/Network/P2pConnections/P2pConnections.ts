import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import Connection, {
  CONNECTION_SERVICE_TYPE, IncomeDataHandler,
} from 'system/interfaces/Connection';

import ActivePeers from './ActivePeers';


/*

new
 request/response
 * port
 * any data

========= OLD ==========
 * request
 * * port
 * * requestId
 * * status 255 = request
 * * any data
 *
 * response
 * * port
 * * requestId
 * * status 0 == OK, >0<255 = response error code
 * * any data | no data
 */

export type PeerStatusHandler = (peerId: string, connectionName: string) => Promise<void>;


/**
 * It sends and receives messages into direct connections.
 */
export default class P2pConnections {
  private context: Context;
  private readonly activePeers: ActivePeers = new ActivePeers();
  private incomeMessagesEvents = new IndexedEvents<IncomeDataHandler>();


  constructor(context: Context) {
    this.context = context;
  }

  init() {
    this.activePeers.init();
    this.initConnections();
  }

  destroy() {
    this.activePeers.destroy();
    this.incomeMessagesEvents.destroy();
    // TODO: на всех connections поидее нужно отписаться
  }


  /**
   * Send new message.
   * It resolves the connection to use.
   * @param peerId - hostId of the closest host which is directly
   *   wired to current host
   * @param port
   * @param payload
   */
  async send(peerId: string, port: number, payload: Uint8Array): Promise<void> {
    const connectionName: string | undefined = this.activePeers.resolveConnectionName(peerId);

    if (!connectionName) {
      throw new Error(`Peer "${peerId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionName);

    await connection.send(peerId, port, payload);
  }

  onIncomeData(cb: IncomeDataHandler): number {
    return this.incomeMessagesEvents.addListener(cb);
  }

  onPeerConnect(cb: PeerStatusHandler): number {
    // TODO: use events
  }

  onPeerDisconnect(cb: PeerStatusHandler): number {
    // TODO: use events
  }


  removeListener(handlerIndex: number) {
    this.incomeMessagesEvents.removeListener(handlerIndex);
  }


  private initConnections() {
    for (let serviceName of Object.keys(this.context.service)) {
      if (this.context.service[serviceName] !== CONNECTION_SERVICE_TYPE) continue;

      this.addConnectionListeners(serviceName, this.context.service[serviceName]);
    }
  }

  private addConnectionListeners(connectionName: string, connection: Connection) {
    connection.startListenPort(NETWORK_PORT, (
      request: ConnectionRequest,
      peerId: string
    ): Promise<Uint8Array> => this.handleIncomeMessages(request, peerId, connectionName));

    connection.onPeerConnect((peerId: string) => {
      this.activePeers.activatePeer(peerId, connectionName);
    });

    connection.onPeerDisconnect((peerId: string) => {
      this.activePeers.deactivatePeer(peerId);
    });
  }

  /**
   * Handle requests which came out of connection and sand status back
   */
  private handleIncomeMessages(
    request: ConnectionRequest,
    peerId: string,
    connectionName: string
  ): Promise<Uint8Array> {
    return new Promise<Uint8Array>((resolve, reject) => {
      const done = (result: Uint8Array) => {
        // TODO: если вернули ошибку ????
        // TODO: перестать ожидать по таймауту
        resolve(result);
      };

      this.activePeers.activatePeer(peerId, connectionName);

      this.incomeMessagesEvents.emit(request.payload, peerId, done);
    });
  }

  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

}
