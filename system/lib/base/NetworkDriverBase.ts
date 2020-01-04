import DriverBase from '../../base/DriverBase';
import NetworkDriver, {
  IncomeRequestHandler, IncomeResponseHandler,
  NetworkRequest,
  NetworkResponse,
  NetworkStatus
} from '../../interfaces/NetworkDriver';
import IndexedEventEmitter from '../IndexedEventEmitter';
import {
  COMMANDS, deserializeRequest, deserializeResponse, makeRequestId,
  MESSAGE_POSITION,
  REQUEST_PAYLOAD_START,
  serializeRequest,
  serializeResponse
} from '../networkHelpers';
import Promised from '../Promised';
import {hexNumToString, stringToUint8Array} from '../binaryHelpers';


type Timeout = NodeJS.Timeout;

enum EVENTS {
  request,
  response,
}


export default abstract class NetworkDriverBase<Props> extends DriverBase<Props> implements NetworkDriver {
  protected events = new IndexedEventEmitter();

  protected abstract write(data: Uint8Array): Promise<void>;



  async request(register: number, body: Uint8Array): Promise<NetworkRequest> {
    const promised = new Promised();
    const requestId: number = makeRequestId();
    const request: NetworkRequest = { requestId, body };
    let timeout: Timeout | undefined;

    this.sendRequest(register, request)
      .catch((e: Error) => {
        clearTimeout(timeout as any);
        !promised.isFulfilled() && promised.reject(e);
      });

    // listen for response
    const listenIndex = this.onIncomeResponse(register, (response: NetworkResponse) => {
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
        new Error(`SerialNetwork.request: Timeout of request has been exceeded of register "${register}"`)
      );
    }, this.config.config.requestTimeoutSec * 1000);

    return promised.promise;
  }

  onRequest(register: number, handler: IncomeRequestHandler): number {
    const wrapper = (request: NetworkRequest) => {
      handler(request)
        .then((response: NetworkResponse) => {
          // send response and don't wait for result
          this.sendResponse(register, response)
            .catch(this.log.error);
        })
        .catch((e) => {
          const response: NetworkResponse = {
            requestId: request.requestId,
            status: NetworkStatus.errorMessage,
            body: new Uint8Array(stringToUint8Array(String(e))),
          };

          this.sendResponse(register, response)
            .catch(this.log.error);
        });
    };

    const eventName: string = `${EVENTS.request}${hexNumToString(register)}`;

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

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.write(data);
  }

  protected sendResponse(register: number, response: NetworkResponse): Promise<void> {
    const data: Uint8Array = serializeResponse(register, response);

    // TODO: может use sendoer для переотправки запроса
    // TODO: либо может sender сделать в нижнем драйвере
    // TODO: можно посылать следующий запрос не дожидаясь пока придет ответ, но запросы должны идти по очереди

    return this.write(data);
  }

  /**
   * Handle income message and deserialize it.
   * @param data
   */
  protected incomeMessage(data: Uint8Array) {
    if (data.length < REQUEST_PAYLOAD_START) {
      return this.log.error(`SerialNetwork: incorrect data length: ${data.length}`);
    }
    else if (
      data[MESSAGE_POSITION.command] !== COMMANDS.request
      && data[MESSAGE_POSITION.command] !== COMMANDS.response
    ) {
      // skip not ours commands
      return;
    }

    const register: number = data[MESSAGE_POSITION.register];

    if (data[MESSAGE_POSITION.command] === COMMANDS.request) {
      const request: NetworkRequest = deserializeRequest(data);
      const eventName: string = `${EVENTS.request}${hexNumToString(register)}`;

      this.events.emit(eventName, request);
    }
    else {
      // response
      const response: NetworkResponse = deserializeResponse(data);
      const eventName: string = `${EVENTS.response}${hexNumToString(register)}`;

      this.events.emit(eventName, response);
    }
  }

}
