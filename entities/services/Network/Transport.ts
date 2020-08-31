import {NETWORK_PORT} from './Network';
import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';

import ActivePeers from './ActivePeers';


type IncomeMessageHandler = (
  payload: Uint8Array,
  fromPeerId: string,
  done: (result: Uint8Array) => void
) => void;


/**
 * It sends and receives messages into direct connections.
 */
export default class Transport {
  private context: Context;
  private readonly activePeers: ActivePeers = new ActivePeers();
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();


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
    // TODO: на всех connections вызывать stopListenPort и removeListener
  }


  /**
   * Send new message.
   * It resolves the connection to use.
   * @param peerId - hostId of the closest host which is directly
   *   wired to current host
   * @param port
   * @param payload
   */
  async request(
    peerId: string,
    port: number,
    payload: Uint8Array,
  ): Promise<Uint8Array> {
    const connectionName: string | undefined = this.activePeers.resolveConnectionName(peerId);

    if (!connectionName) {
      throw new Error(`Peer "${peerId}" hasn't been connected`);
    }

    // TODO: может интерфейс запроса-ответа здесь сделать ??? а в connections просто send

    const connection: Connection = this.getConnection(connectionName);
    const response: ConnectionResponse = await connection.request(
      peerId,
      port,
      payload
    );

    if (response.status === ConnectionStatus.responseError) {
      throw new Error(response.error);
    }

    if (!response.payload) {
      throw new Error(`No response.payload`);
    }

    // TODO: зачем здесь payload ??? ответ же просто информативный

    return response.payload;
  }

  onIncomeMessage(cb: IncomeMessageHandler) {
    return this.incomeMessagesEvents.addListener(cb);
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
