import ServiceBase from 'system/base/ServiceBase';
import Context from 'system/Context';
import EntityDefinition from 'system/interfaces/EntityDefinition';
import {callSafely} from 'system/lib/common';
import Promised from 'system/lib/Promised';
import {asciiToUint8Array, uint8ArrayToAscii} from 'system/lib/serialize';

import Router from './Router';


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

type Timeout = NodeJS.Timeout;
type UriHandler = (request: NetworkMessage) => Promise<Uint8Array>;

// TODO: наверное 254
// port of connection which network uses to send and receive messages
export const NETWORK_PORT = 252;

// TODO: не будет наверное использоваться
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

    this.router = new Router(this.context);
  }


  init = async () => {
    this.router.init();
    this.router.onIncomeRequest(this.handleIncomeRequest);
  }

  destroy = async () => {
    this.router.destroy();
    delete this.incomeRequestHandlers;
  }


  /**
   * Send request and wait for response
   */
  async request(
    toHostId: string,
    uri: string,
    payload: Uint8Array,
    TTL?: number
  ): Promise<Uint8Array> {
    if (uri.length <= 1) {
      throw new Error(`Uri has to have length greater than 1. One byte is for status number`);
    }

    const messageId: string = this.router.newMessageId();

    // send request and wait while it is finished
    await this.router.send(
      toHostId,
      uri,
      payload,
      messageId,
      TTL,
    );

    const promised = new Promised<Uint8Array>();
    let timeout: Timeout | undefined;
    const responseListener: number = this.router.onIncomeResponse((
      incomeMessage: NetworkMessage
    ) => {
      if (incomeMessage.messageId !== messageId) return;

      this.router.removeListener(responseListener);
      clearTimeout(timeout as any);

      if (incomeMessage.uri === String(SPECIAL_URI.responseError)) {
        // if an error has been returned just convert it to string and reject promise
        return promised.reject(new Error(uint8ArrayToAscii(incomeMessage.payload)));
      }
      else if (incomeMessage.uri !== String(SPECIAL_URI.responseOk)) {
        return promised.reject(new Error(`Unknown response URI "${incomeMessage.uri}"`));
      }
      // it's OK
      promised.resolve(payload);
    });

    timeout = setTimeout(() => {
      if (promised.isFulfilled()) return;

      this.router.removeListener(responseListener);

      promised.reject(new Error(
        `Timeout of request has been exceeded of URI "${uri}"`
      ));
    }, this.config.config.requestTimeoutSec * 1000);

    return promised.promise;
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
  private handleIncomeRequest(incomeMessage: NetworkMessage) {
    if (!this.incomeRequestHandlers[incomeMessage.uri]) {
      // TODO: поидее нужно отправить ответным сообщением сразу
      this.router.send(
        incomeMessage.from,
        String(SPECIAL_URI.responseError),
        asciiToUint8Array(`No handler on uri "${incomeMessage.uri}"`),
        incomeMessage.messageId,
      )
        .catch(this.log.error);

      return;
    }

    callSafely(
      this.incomeRequestHandlers[incomeMessage.uri],
      incomeMessage,
      //{ port: request.port, requestId: request.requestId }
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
      .catch((e: Error) => {
        this.router.send(
          incomeMessage.from,
          String(SPECIAL_URI.responseError),
          asciiToUint8Array(`Error while executing handler of uri "${incomeMessage.uri}" :${e}`),
          incomeMessage.messageId,
        )
          .catch(this.log.error);
      });
  }

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
