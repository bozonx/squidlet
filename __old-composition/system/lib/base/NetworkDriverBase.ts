import DriverBase from '../../../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/base/DriverBase.js';
import NetworkDriver, {
  IncomeRequestHandler, IncomeResponseHandler,
  NetworkRequest,
  NetworkResponse,
  NetworkStatus
} from '../../../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/NetworkDriver.js';
import IndexedEventEmitter from '../../../../../squidlet-lib/src/IndexedEventEmitter';
import {
  COMMANDS, deserializeRequest, deserializeResponse, makeRequestId,
  MESSAGE_POSITION,
  REQUEST_PAYLOAD_START,
  serializeRequest,
  serializeResponse
} from '../../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/networkHelpers.js';
import Promised from '../../../../../squidlet-lib/src/Promised';
import {hexNumToString, stringToUint8Array} from '../../../../../squidlet-lib/src/binaryHelpers';


type Timeout = NodeJS.Timeout;

enum EVENTS {
  request,
  response,
}


export default abstract class NetworkDriverBase<Props> extends DriverBase<Props> implements NetworkDriver {
  protected events = new IndexedEventEmitter();

  protected abstract write(data: Uint8Array): Promise<void>;


  async request(port: number, body: Uint8Array): Promise<NetworkResponse> {
    const promised = new Promised<NetworkResponse>();
    const requestId: number = makeRequestId();
    const request: NetworkRequest = { requestId, body };
    let timeout: Timeout | undefined;

    this.sendRequest(port, request)
      .catch((e: Error) => {
        clearTimeout(timeout as any);
        !promised.isFulfilled() && promised.reject(e);
      });

    // listen for response
    const listenIndex = this.onIncomeResponse(port, (response: NetworkResponse) => {
      // do nothing if filed or resolved. process only ours request
      if (promised.isFulfilled() || response.requestId !== requestId) return;

      this.removeListener(listenIndex);
      clearTimeout(timeout as any);

      promised.resolve(response);
    });

    timeout = setTimeout(() => {
      if (promised.isFulfilled()) return;

      this.removeListener(listenIndex);

      promised.reject(
        new Error(`SerialNetwork.request: Timeout of request has been exceeded of port "${port}"`)
      );
    }, this.config.config.requestTimeoutSec * 1000);

    return promised.promise;
  }

  onRequest(port: number, handler: IncomeRequestHandler): number {
    const wrapper = (request: NetworkRequest) => {
      handler(request)
        .then((response: NetworkResponse) => {
          // send response and don't wait for result
          this.sendResponse(port, response)
            .catch(this.log.error);
        })
        .catch((e) => {
          const response: NetworkResponse = {
            requestId: request.requestId,
            status: NetworkStatus.errorMessage,
            body: new Uint8Array(stringToUint8Array(String(e))),
          };

          this.sendResponse(port, response)
            .catch(this.log.error);
        });
    };

    const eventName: string = `${EVENTS.request}${hexNumToString(port)}`;

    return this.events.addListener(eventName, wrapper);
  }

  removeListener(handlerIndex: number): void {
    this.events.removeListener(handlerIndex);
  }


  protected onIncomeResponse(register: number, handler: IncomeResponseHandler): number {
    const eventName: string = `${EVENTS.response}${hexNumToString(register)}`;

    return this.events.addListener(eventName, handler);
  }

  protected sendRequest(register: number, request: NetworkRequest): Promise<void> {
    const data: Uint8Array = serializeRequest(register, request);

    return this.write(data);
  }

  protected sendResponse(register: number, response: NetworkResponse): Promise<void> {
    const data: Uint8Array = serializeResponse(register, response);

    return this.write(data);
  }

  /**
   * Handle income message and deserialize it.
   * @param data
   */
  protected incomeMessage(data: Uint8Array) {
    if (!data.length || ![COMMANDS.request, COMMANDS.response].includes(data[MESSAGE_POSITION.command])) {
      // skip not ours commands or empty data
      return;
    }
    else if (data.length < REQUEST_PAYLOAD_START) {
      throw new Error(`NetworkDriverBase.incomeMessage: incorrect data length: ${data.length}`);
    }

    const register: number = data[MESSAGE_POSITION.register];

    if (data[MESSAGE_POSITION.command] === COMMANDS.request) {
      const request: NetworkRequest = deserializeRequest(data);
      const eventName: string = this.makeEventName(EVENTS.request, register);

      this.events.emit(eventName, request);
    }
    else {
      // response
      const response: NetworkResponse = deserializeResponse(data);
      const eventName: string = this.makeEventName(EVENTS.response, register);

      this.events.emit(eventName, response);
    }
  }

  protected makeEventName(eventName: EVENTS, register: number): string {
    return `${EVENTS.request}${hexNumToString(register)}`;
  }

}
