import {NETWORK_PORT} from './Network';
import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';

import ActiveHosts, {HostItem} from './ActiveHosts';


type IncomeMessageHandler = (
  payload: Uint8Array,
  fromClosestHost: string,
  done: (result: Uint8Array) => void
) => void;


/**
 * It sends and receives messages into network.
 * It resends messages further to the next subnet.
 */
export default class Transport {
  private context: Context;
  private readonly activeHosts: ActiveHosts;
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();


  constructor(context: Context) {
    this.context = context;
    this.activeHosts = new ActiveHosts();
  }

  init() {
    this.initConnections();
  }

  destroy() {
    this.activeHosts.destroy();
    this.incomeMessagesEvents.destroy();
    // TODO: на всех connections вызывать stopListenPort и removeListener
  }


  /**
   * Send new message.
   * It resolves the connection to use.
   * @param toClosestHostId - hostId of the closest host which is directly
   *   wired to current host
   * @param payload
   */
  async send(
    toClosestHostId: string,
    payload: Uint8Array,
  ): Promise<Uint8Array> {
    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(toClosestHostId);

    if (!connectionItem) {
      throw new Error(`Host "${toClosestHostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem.connectionName);

    const response: ConnectionResponse = await connection.request(
      connectionItem.peerId,
      NETWORK_PORT,
      payload
    );

    if (response.status === ConnectionStatus.responseError) {
      throw new Error(response.error);
    }

    if (!response.payload) {
      throw new Error(`No response.payload`);
    }

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
      // TODO: нужно отправить запрос genHostId и потом зарегистрировать
      //this.activeHosts.cacheHost(closestHostId, peerId, connectionName);
      // TODO: зарегистрировать соединение
    });

    connection.onPeerDisconnect((peerId: string) => {
      // TODO: закрыть соединение
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

      // TODO: обновить кэш! Но где заранее взять имя хоста ????
      //this.cacheRoute(incomeMessage, peerId, connectionName);

      const hostItem: HostItem | undefined = this.activeHosts.resolveByPeerId(peerId);

      if (!hostItem) {
        throw new Error(`Can't resolve hostItem by peerId ${peerId}`);
      }

      this.incomeMessagesEvents.emit(request.payload, hostItem.hostId, done);
    });
  }

  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

  // private cacheRoute(incomeMessage: NetworkMessage, peerId: string, connectionName: string) {
  //   const closestHostId: string = (incomeMessage.route.length)
  //     ? lastItem(incomeMessage.route)
  //     : incomeMessage.from;
  //
  //   this.activeHosts.cacheHost(closestHostId, peerId, connectionName);
  //
  //   if (incomeMessage.route.length) {
  //     //this.router.cacheRoute(incomeMessage.to, incomeMessage.from, incomeMessage.route);
  //   }
  // }

}
