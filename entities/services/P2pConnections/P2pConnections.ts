import Context from 'system/Context';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import Connection, {
  CONNECTION_SERVICE_TYPE, IncomeMessageHandler,
} from 'system/interfaces/Connection';
import ServiceBase from 'system/base/ServiceBase';

import ActivePeers from './ActivePeers';


export type PeerStatusHandler = (peerId: string, connectionName: string) => void;

enum P2pConnectionsEvents {
  message,
  connected,
  disconnected
}


/**
 * It sends and receives messages into direct connections.
 */
export default class P2pConnections extends ServiceBase {
  private context: Context;
  private events = new IndexedEventEmitter();
  //private readonly activePeers: ActivePeers = new ActivePeers();
  // connections by peers - {peerId: connectionName}
  private activePeers: {[index: string]: string} = {};


  constructor(context: Context) {
    this.context = context;
  }

  init() {
    //this.activePeers.init();
    this.initConnections();
  }

  destroy() {
    //this.activePeers.destroy();
    this.events.destroy();
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
    const connectionName: string | undefined = this.activePeers[peerId];

    if (!connectionName) {
      throw new Error(`Peer "${peerId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionName);

    await connection.send(peerId, port, payload);
  }

  onIncomeMessage(cb: IncomeMessageHandler): number {
    return this.events.addListener(P2pConnectionsEvents.message, cb);
  }

  onPeerConnect(cb: PeerStatusHandler): number {
    return this.events.addListener(P2pConnectionsEvents.connected, cb);
  }

  onPeerDisconnect(cb: PeerStatusHandler): number {
    return this.events.addListener(P2pConnectionsEvents.disconnected, cb);
  }


  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }


  private initConnections() {
    for (let serviceName of Object.keys(this.context.service)) {
      if (this.context.service[serviceName] !== CONNECTION_SERVICE_TYPE) continue;

      this.addConnectionListeners(serviceName, this.context.service[serviceName]);
    }
  }

  private addConnectionListeners(connectionName: string, connection: Connection) {
    connection.onIncomeMessage((
      peerId: string,
      port: number,
      payload: Uint8Array
    ): void => this.handleIncomeMessages(peerId, port, payload, connectionName));

    connection.onPeerConnect((peerId: string) => {
      this.activatePeer(peerId, connectionName);
    });

    connection.onPeerDisconnect((peerId: string) => {
      this.deactivatePeer(peerId, connectionName);
    });
  }

  /**
   * Handle requests which came out of connection and sand status back
   */
  private handleIncomeMessages(
    peerId: string,
    port: number,
    payload: Uint8Array,
    connectionName: string
  ): void {


    // return new Promise<Uint8Array>((resolve, reject) => {
    //   const done = (result: Uint8Array) => {
    //     // TODO: если вернули ошибку ????
    //     // TODO: перестать ожидать по таймауту
    //     resolve(result);
    //   };
    //
    //   this.activePeers.activatePeer(peerId, connectionName);
    //
    //   this.incomeMessagesEvents.emit(request.payload, peerId, done);
    // });
  }

  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

  activatePeer(peerId: string, connectionName: string) {
    if (this.activePeers[peerId] && this.activePeers[peerId] !== connectionName) {
      throw new Error(
        `Peer ${peerId} has different connection.` +
        ` Last is ${this.activePeers[peerId]}, new id ${connectionName}`
      );
    }

    const wasRegistered: boolean = Boolean(this.activePeers[peerId]);

    this.activePeers[peerId] = connectionName;

    if (!wasRegistered) {
      this.events.emit(P2pConnectionsEvents.connected, peerId, connectionName);
    }
  }

  deactivatePeer(peerId: string, connectionName: string) {
    delete this.activePeers[peerId];

    this.events.emit(P2pConnectionsEvents.disconnected, peerId, connectionName);
  }

}
