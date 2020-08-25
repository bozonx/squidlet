import Context from 'system/Context';
import IndexedEvents from 'system/lib/IndexedEvents';
import Connection, {CONNECTION_SERVICE_TYPE, ConnectionRequest, ConnectionStatus} from 'system/interfaces/Connection';
import {lastItem} from 'system/lib/arrays';

import Network, {NETWORK_PORT, NetworkMessage, RESPONSE_STATUS, SPECIAL_URI} from './Network';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import ActiveHosts, {HostItem} from './ActiveHosts';


type IncomeMessageHandler = (incomeMessage: NetworkMessage) => void;


export default class Router {
  private context: Context;
  private incomeMessagesEvents = new IndexedEvents<IncomeMessageHandler>();
  private incomeResponseEvents = new IndexedEvents<IncomeMessageHandler>();
  private readonly activeHosts: ActiveHosts;


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


  newMessageId(): string {
    // TODO: add
  }

  // TODO: поидее не нужно делать обычными событиями,
  //  так как всеравно на 1 uri навешивается 1 обработчик
  onIncomeRequest(handler: IncomeMessageHandler): number {
    return this.incomeMessagesEvents.addListener(handler);
  }

  onIncomeResponse(cb: IncomeMessageHandler): number {

    // TODO: подниматьсобытия

    return this.incomeResponseEvents.addListener(cb);
  }

  removeListener(handlerIndex: number) {
    this.incomeMessagesEvents.removeListener(handlerIndex);
  }


  // cacheRoute(
  //   incomeMessageTo: string,
  //   incomeMessageFrom: string,
  //   incomeMessageRoute: string[],
  // ) {
  //   // TODO: add
  // }

  // hasToBeRouted(message: NetworkMessage): boolean {
  //   // TODO: add
  // }

  /**
   * Send mediate message or new one
   * @param incomeMessage
   */
  async sendMessage(incomeMessage: NetworkMessage) {
    // TODO: add
  }

  /**
   * Send new message or response
   * If requestId doesn't set it will be generated
   * If TTL doesn't set the default value will be used
   */
  async send(
    toHostId: string,
    uri: string,
    payload: Uint8Array | string,
    messageId: string,
    TTL?: number
  ) {
    // TODO: payload string преобразовать в Uint

    // TODO: нужен requestId иначе на другой стороне мы не поймем на что пришел ответ

    const message: NetworkMessage = {
      TTL: this.context.config.config.defaultTtl,
      to: request.from,
      from: this.context.config.id,
      route: [],
      uri: SPECIAL_URI.routed,
      payload,
    };
    // TODO: если надо переслать уменьшить ttl
    // TODO: add
    encodeNetworkMessage(message);

    // const request: NetworkMessage = {
    //   to: toHostId,
    //   from: this.context.config.id,
    //   route: [],
    //   TTL: this.context.config.config.defaultTtl,
    //   uri,
    //   payload,
    // };
    //const encodedMessage: Uint8Array = encodeNetworkMessage(request);

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.payload) {
      throw new Error(`Result doesn't contains the payload`);
    }

    // TODO: принимать RESPONSE_STATUS - выводить в лог
    // TODO: ответ ждать в течении таймаута так как он может уйти далеко
    // TODO: add uri response

    const response: NetworkMessage = decodeNetworkMessage(connectionResponse.payload);

    // TODO: review

    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(toHostId);

    if (!connectionItem) {
      throw new Error(`Host "${toHostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem.connectionName);

    // TODO:  может использовать такой метов в connection.sendResponseBack()
    // const result: ConnectionResponse = await connection.request(
    //   peerId,
    //   response.channel,
    //   // TODO: в случае ошибки отправить error
    //   response.payload,
    // );
  }

  // private makeResponse(to: string, uri: string, payload?: Uint8Array): NetworkMessage {
  //   return {
  //     TTL: this.context.config.config.defaultTtl,
  //     to,
  //     from: this.context.config.id,
  //     // TODO: сформировать маршрут, ближайший хост может быть другой
  //     route: [],
  //     uri,
  //     payload: payload || new Uint8Array(0),
  //   };
  // }

  // send message back which means that income message was routed.
  // return encodeNetworkMessage({
  //   TTL: this.context.config.config.defaultTtl,
  //   to: incomeMessage.from,
  //   from: this.context.config.id,
  //   route: [],
  //   uri: SPECIAL_URI.routed,
  //   payload: new Uint8Array(0),
  // });

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
  private async handleIncomeMessages(
    request: ConnectionRequest,
    peerId: string,
    connectionName: string
  ): Promise<Uint8Array> {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(request.payload);

    this.cacheRoute(incomeMessage, peerId, connectionName);

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host send message further
      this.sendMessage(incomeMessage)
        .catch(this.context.log.error);
      // send status routed back
      return new Uint8Array([RESPONSE_STATUS.routed]);
    }
    // send status OK back
    return new Uint8Array([RESPONSE_STATUS.received]);
  }

  private cacheRoute(incomeMessage: NetworkMessage, peerId: string, connectionName: string) {
    const closestHostId: string = (incomeMessage.route.length)
      ? lastItem(incomeMessage.route)
      : incomeMessage.from;

    this.activeHosts.cacheHost(closestHostId, peerId, connectionName);

    if (incomeMessage.route.length) {
      //this.router.cacheRoute(incomeMessage.to, incomeMessage.from, incomeMessage.route);
    }
  }

  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
  }

}
