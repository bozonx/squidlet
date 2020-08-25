import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {omitObj} from 'system/lib/objects';

import ActiveHosts, {HostItem} from './ActiveHosts';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import Router from './Router';
import {lastItem} from '../../../system/lib/arrays';


export interface NetworkProps {
}

export interface NetworkMessage {
  TTL: number;
  // 2 or more character is allowed
  uri: string;
  to: string;
  from: string;
  // hosts between "to" and "from"
  route: string[];
  payload: Uint8Array;
}

// TODO: review
export interface NetworkResponseFull extends NetworkMessage {
  // TODO: может отправлять вторым аргументом?
  connectionMessage: ConnectionMessage;
}

type NetworkOnRequestHandler = (request: NetworkMessage) => Promise<Uint8Array>;

// channel of connection which network uses to send and receive messages
const NETWORK_PORT = 252;
export const SPECIAL_URI = {
  // TODO: поидее не нужно
  routed: '0',
  // TODO: поидее не нужно
  response: '1',
  responseError: '2',
  timeout: '3',
  getName: '4',
  ping: '5',
  pong: '6',
};
export enum RESPONSE_STATUS {
  ok,
  routed,
}


export default class Network extends ServiceBase<NetworkProps> {
  private readonly activeHosts: ActiveHosts;
  private readonly router: Router;
  private incomeRequestHandlers: {[index: string]: NetworkOnRequestHandler} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.activeHosts = new ActiveHosts();
    this.router = new Router();
  }


  init = async () => {
    this.initConnections();
  }

  destroy = async () => {
    this.activeHosts.destroy();
    this.router.destroy();
    delete this.incomeRequestHandlers;

    // TODO: на всех connections вызывать stopListenPort и removeListener
  }


  // TODO: review
  async request(
    toHostId: string,
    uri: string,
    payload: Uint8Array,
    TTL?: number
  ): Promise<NetworkResponseFull> {
    if (uri.length <= 1) {
      throw new Error(`Uri has to have length greater than 1. One byte is for status number`);
    }

    const connectionItem: HostItem | undefined = this.activeHosts.resolveByHostId(toHostId);

    if (!connectionItem) {
      throw new Error(`Host "${toHostId}" hasn't been connected`);
    }

    const connection: Connection = this.getConnection(connectionItem.connectionName);
    const request: NetworkMessage = {
      to: toHostId,
      from: this.context.config.id,
      route: [],
      TTL: this.context.config.config.defaultTtl,
      uri,
      payload,
    };
    const encodedMessage: Uint8Array = encodeNetworkMessage(request);
    // make request
    const connectionResponse: ConnectionResponse = await connection.request(
      connectionItem.peerId,
      //NETWORK_CHANNEL,
      encodedMessage
    );

    if (connectionResponse.status === ConnectionStatus.responseError) {
      throw new Error(connectionResponse.error);
    }
    else if (!connectionResponse.payload) {
      throw new Error(`Result doesn't contains the payload`);
    }

    // TODO: ответ ждать в течении таймаута так как он может уйти далеко
    // TODO: add uri response

    const response: NetworkMessage = decodeNetworkMessage(connectionResponse.payload);

    return {
      ...response,
      connectionMessage: omitObj(
        connectionResponse,
        'payload',
        'error'
      ) as ConnectionMessage,
    };
  }

  /**
   * Handle income requests. Only on handler of one uri is allowed.
   * @param uri
   * @param handler
   */
  onRequest(uri: string, handler: NetworkOnRequestHandler) {
    if (this.incomeRequestHandlers[uri]) {
      throw new Error(`Handler of uri has already defined`);
    }

    this.incomeRequestHandlers[uri] = handler;
  }

  removeListener(uri: string): void {
    delete this.incomeRequestHandlers[uri];
  }


  private getConnection(connectionName: string): Connection {
    if (!this.context.service[connectionName]) {
      throw new Error(`Can't find connection "${connectionName}"`);
    }

    return this.context.service[connectionName];
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
    ): Promise<Uint8Array> => {
      return this.handleIncomeMessage(request, peerId, connectionName);
    });
    connection.onPeerConnect((peerId: string) => {
      // TODO: нужно отправить запрос genHostId и потом зарегистрировать
      //this.activeHosts.cacheHost(closestHostId, peerId, connectionName);
      // TODO: зарегистрировать соединение
    });
    connection.onPeerDisconnect((peerId: string) => {
      // TODO: закрыть соединение
    });
  }

  private async handleIncomeMessage(
    request: ConnectionRequest,
    peerId: string,
    connectionName: string
  ): Promise<Uint8Array> {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(request.payload);

    this.cacheRoute(incomeMessage, peerId, connectionName);

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host send message further
      this.router.sendFurther(incomeMessage);
      // send status routed back
      return new Uint8Array([RESPONSE_STATUS.routed]);
    }
    else if (!this.incomeRequestHandlers[incomeMessage.uri]) {
      // TODO: может отправить статус ошибки тут, а не в connection
      throw new Error(`No handler on uri "${incomeMessage.uri}"`);
    }

    await this.executeUriHandler(incomeMessage);

    // send status OK back
    return new Uint8Array([RESPONSE_STATUS.ok]);
  }

  private cacheRoute(incomeMessage: NetworkMessage, peerId: string, connectionName: string) {
    const closestHostId: string = (incomeMessage.route.length)
      ? lastItem(incomeMessage.route)
      : incomeMessage.from;

    this.activeHosts.cacheHost(closestHostId, peerId, connectionName);

    if (incomeMessage.route.length) {
      this.router.cacheRoute(incomeMessage.to, incomeMessage.from, incomeMessage.route);
    }
  }

  private async executeUriHandler(incomeMessage: NetworkMessage) {
    let payloadToSendBack: Uint8Array;
    // execute handler of uri
    try {
      // TODO: добавить данные connection - channel, requestId
      payloadToSendBack = await this.incomeRequestHandlers[incomeMessage.uri](incomeMessage);
    }
    catch (e) {
      throw new Error(`Error while executing handler of uri "${incomeMessage.uri}" :${e}`);
    }
    // send response but don't wait for result
    this.sendResponse(payloadToSendBack, incomeMessage);
  }

  private sendResponse(payload: Uint8Array, request: NetworkMessage) {
    const connection: Connection = await this.resolveConnection(response.hostId);
    // TODO: resolve it !!!!!
    const peerId = '1';

    const encodedMessage: Uint8Array = encodeNetworkMessage({
      TTL: this.context.config.config.defaultTtl,
      to: incomeMessage.from,
      from: this.context.config.id,
      route: [],
      uri: SPECIAL_URI.routed,
      payload: new Uint8Array(0),
    });

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
}
