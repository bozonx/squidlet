import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import Connection, {
  CONNECTION_SERVICE_TYPE,
  ConnectionMessage,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {lastItem} from 'system/lib/arrays';
import {omitObj} from 'system/lib/objects';

import ActiveHosts, {HostItem} from './ActiveHosts';
import {decodeNetworkMessage, encodeNetworkMessage} from './helpers';
import Router from './Router';


export interface NetworkProps {
}

export interface NetworkMessage {
  // 1 byte number, max 255. Each mediate host decrements this value.
  TTL: number;
  // 8 bytes hash which uses to send responses back
  requestId: string;
  // 2 or more character which represent resource on the host "to"
  // which listens to income requests
  uri: string;
  // hostId which is recipient of this message
  to: string;
  // hostId which send the message
  from: string;
  // mediate hosts between "to" and "from"
  route: string[];
  payload: Uint8Array;
}

type UriHandler = (request: NetworkMessage, connectionRequest: ConnectionMessage) => Promise<Uint8Array>;

// port of connection which network uses to send and receive messages
const NETWORK_PORT = 252;

export enum SPECIAL_URI {
  responseOk,
  responseError,
  //timeout,
  getName,
  ping,
  pong,
}
// status of response of connection
export enum RESPONSE_STATUS {
  ok,
  routed,
}


export default class Network extends ServiceBase<NetworkProps> {
  private readonly activeHosts: ActiveHosts;
  private readonly router: Router;
  private incomeRequestHandlers: {[index: string]: UriHandler} = {};


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

    // TODO: принимать RESPONSE_STATUS - выводить в лог
    // TODO: ответ ждать в течении таймаута так как он может уйти далеко
    // TODO: add uri response

    const response: NetworkMessage = decodeNetworkMessage(connectionResponse.payload);

    // TODO: use router.send

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
  startListenUrl(uri: string, handler: UriHandler) {
    if (this.incomeRequestHandlers[uri]) {
      throw new Error(`Handler of uri has already defined`);
    }

    this.incomeRequestHandlers[uri] = handler;
  }

  stopListenUri(uri: string) {
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
    ): Promise<Uint8Array> => this.handleIncomeRequest(request, peerId, connectionName));
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
  private async handleIncomeRequest(
    request: ConnectionRequest,
    peerId: string,
    connectionName: string
  ): Promise<Uint8Array> {
    const incomeMessage: NetworkMessage = decodeNetworkMessage(request.payload);

    this.cacheRoute(incomeMessage, peerId, connectionName);

    if (incomeMessage.to !== this.context.config.id) {
      // if receiver isn't current host send message further
      this.router.sendMessage(incomeMessage)
        .catch(this.log.error);
      // send status routed back
      return new Uint8Array([RESPONSE_STATUS.routed]);
    }
    else if (!this.incomeRequestHandlers[incomeMessage.uri]) {
      // TODO: может отправить статус ошибки тут, а не в connection
      throw new Error(`No handler on uri "${incomeMessage.uri}"`);
    }

    // TODO: может отправить статус ошибки тут, а не в connection
    await this.executeUriHandler(incomeMessage, request);

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

  private async executeUriHandler(incomeMessage: NetworkMessage, request: ConnectionRequest) {
    let payloadToSendBack: Uint8Array;
    // execute handler of uri
    try {
      payloadToSendBack = await this.incomeRequestHandlers[incomeMessage.uri](
        incomeMessage,
        {
          port: request.port,
          requestId: request.requestId,
        }
      );
    }
    catch (e) {
      throw new Error(`Error while executing handler of uri "${incomeMessage.uri}" :${e}`);
    }
    // send response but don't wait for result
    // TODO: нужен requestId иначе на другой стороне мы не поймем на что пришел ответ
    this.router.send(
      incomeMessage.from,
      String(SPECIAL_URI.responseOk),
      payloadToSendBack,
      incomeMessage.TTL
    )
      .catch(this.log.error);
  }

}
