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
import {callSafely} from '../../../system/lib/common';


export interface NetworkProps {
}

export interface NetworkMessage {
  // 1 byte number, max 255. Each mediate host decrements this value.
  TTL: number;
  // 8 bytes hash which uses to send responses back
  messageId: string;
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
export const NETWORK_PORT = 252;

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
  // message has been successfully received
  received,
  // message has been send further on the route
  routed,
}


export default class Network extends ServiceBase<NetworkProps> {
  private readonly router: Router;
  private incomeRequestHandlers: {[index: string]: UriHandler} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.router = new Router(this, this.context);
  }


  init = async () => {
    this.router.init();
    this.router.onIncomeRequest(this.handleIncomeRequest);
  }

  destroy = async () => {
    this.router.destroy();
    delete this.incomeRequestHandlers;
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


  /**
   * Handle request which is for current host
   */
  private handleIncomeRequest(
    incomeMessage: NetworkMessage,
    request: ConnectionRequest
  ) {
    if (!this.incomeRequestHandlers[incomeMessage.uri]) {
      this.router.send(
        incomeMessage.from,
        String(SPECIAL_URI.responseError),
        `No handler on uri "${incomeMessage.uri}"`,
        incomeMessage.messageId,
      )
        .catch(this.log.error);

      return;
    }

    callSafely(
      this.incomeRequestHandlers[incomeMessage.uri],
      incomeMessage,
      {
        port: request.port,
        requestId: request.requestId,
      }
    )
      .then((payloadToSendBack: Uint8Array) => {
        // send response but don't wait for result
        this.router.send(
          incomeMessage.from,
          String(SPECIAL_URI.responseOk),
          payloadToSendBack,
          incomeMessage.messageId,
        )
          .catch(this.log.error);
      })
      .catch((e) => {
        this.router.send(
          incomeMessage.from,
          String(SPECIAL_URI.responseError),
          `Error while executing handler of uri "${incomeMessage.uri}" :${e}`,
          incomeMessage.messageId,
        )
          .catch(this.log.error);
      });
  }

}
