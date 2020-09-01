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
  // complete route between "from" and bearer(last host which sent this message)
  // "from" is the first element and bearer is the last  one.
  completeRoute: string[];
  payload: Uint8Array;
}

type Timeout = NodeJS.Timeout;
type UriHandler = (request: NetworkMessage) => Promise<Uint8Array>;

// port of connection which network uses to send and receive messages
export const NETWORK_PORT = 254;

export enum SPECIAL_URI {
  responseOk,
  responseError,
  getName,
  ping,
  pong,
}


export default class Network extends ServiceBase<NetworkProps> {
  private readonly router: Router;
  private uriHandlers: {[index: string]: UriHandler} = {};


  constructor(context: Context, definition: EntityDefinition) {
    super(context, definition);

    this.router = new Router(this.context);
  }


  init = async () => {
    this.router.init();
    this.router.onIncomeMessage(this.handleIncomeMessage);
  }

  destroy = async () => {
    this.router.destroy();

    delete this.uriHandlers;
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
    await this.router.send(toHostId, uri, payload, messageId, TTL);

    return this.waitForResponse(uri, messageId);
  }

  /**
   * Handle income requests. Only on handler of one uri is allowed.
   * @param uri
   * @param handler
   */
  startListenUri(uri: string, handler: UriHandler) {
    if (this.uriHandlers[uri]) {
      throw new Error(`Handler of uri has already defined`);
    }

    this.uriHandlers[uri] = handler;
  }

  stopListenUri(uri: string) {
    delete this.uriHandlers[uri];
  }


  /**
   * Handle request which is for current host
   */
  private handleIncomeMessage(incomeMessage: NetworkMessage) {
    // listen only requests. They have uri with length greater than 1
    if (incomeMessage.uri.length <= 1 ) return;
    // if no handler - then send an error back
    if (!this.uriHandlers[incomeMessage.uri]) {
      this.router.send(
        incomeMessage.completeRoute[0],
        String(SPECIAL_URI.responseError),
        asciiToUint8Array(`No handler on uri "${incomeMessage.uri}"`),
        incomeMessage.messageId,
      )
        .catch(this.log.error);

      return;
    }
    // call handler and send response but don't wait for result
    this.callUriHandlerAndSandBack(incomeMessage)
      .catch(this.log.error);
  }

  private async callUriHandlerAndSandBack(incomeMessage: NetworkMessage) {
    let backUri: string = String(SPECIAL_URI.responseOk);
    let payloadToSendBack: Uint8Array;

    try {
      payloadToSendBack = await callSafely(
        this.uriHandlers[incomeMessage.uri],
        incomeMessage,
      );
    }
    catch (e) {
      backUri = String(SPECIAL_URI.responseError);
      payloadToSendBack = asciiToUint8Array(`Error while executing handler of uri "${incomeMessage.uri}" :${e}`);
    }
    // send back data which handler returned or error
    await this.router.send(
      incomeMessage.completeRoute[0],
      backUri,
      payloadToSendBack,
      incomeMessage.messageId,
    );
  }

  private waitForResponse(uri: string, messageId: string): Promise<Uint8Array> {
    const promised = new Promised<Uint8Array>();
    let timeout: Timeout | undefined;

    const responseListener: number = this.router.onIncomeMessage((
      incomeMessage: NetworkMessage
    ) => {
      // listen only ours response
      if (incomeMessage.messageId !== messageId) return;

      this.router.removeListener(responseListener);
      clearTimeout(timeout as any);

      this.processResponse(incomeMessage)
        .then(promised.resolve)
        .catch(promised.reject);
    });

    timeout = setTimeout(() => {
      this.router.removeListener(responseListener);

      if (promised.isFulfilled()) return;

      promised.reject(new Error(
        `Timeout of request has been exceeded of URI "${uri}"`
      ));
    }, this.config.config.requestTimeoutSec * 1000);

    return promised.promise;
  }

  private async processResponse(incomeMessage: NetworkMessage): Promise<Uint8Array> {
    switch (incomeMessage.uri) {
      case String(SPECIAL_URI.responseOk):
        // it's OK
        return incomeMessage.payload;

      case String(SPECIAL_URI.responseError):
        // if an error has been returned just convert it to string and reject promise
        throw new Error(uint8ArrayToAscii(incomeMessage.payload));
      default:
        throw new Error(`Unknown response URI "${incomeMessage.uri}"`);
    }
  }

}
