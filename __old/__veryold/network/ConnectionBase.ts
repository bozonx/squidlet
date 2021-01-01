import ServiceBase from '../../base/ServiceBase';
import Connection, {
  ConnectionOnRequestHandler,
  ConnectionRequest,
  ConnectionResponse
} from '../../interfaces/Connection';
import IndexedEvents from '../IndexedEvents';
import {
  decodeIncomeMessage,
  encodeRequest,
  encodeResponse, isConnectionMessage,
  isRequest,
  makeConnectionRequest
} from '../connectionHelpers';
import Promised from '../Promised';


type Timeout = NodeJS.Timeout;
type IncomeRequestHandler = (request: ConnectionRequest, sessionId: string) => void;
type IncomeResponseHandler = (response: ConnectionResponse, sessionId: string) => void;


// TODO: где должен сверяться request id ???


export default abstract class ConnectionBase<Props> extends ServiceBase<Props> implements Connection {
  protected incomeRequestsEvent = new IndexedEvents<IncomeRequestHandler>();
  protected incomeResponsesEvent = new IndexedEvents<IncomeResponseHandler>();

  protected abstract write(sessionId: string, data: Uint8Array): Promise<void>;


  async request(peerId: string, port: number, data: Uint8Array): Promise<ConnectionResponse> {

    // TODO: запрещать использовать порты 253, 254, 255

    const request: ConnectionRequest = makeConnectionRequest(channel, data);
    const requestMessage: Uint8Array = encodeRequest(request);
    // send request and wait while sending is finished
    await this.write(sessionId, requestMessage);

    const promised = new Promised<ConnectionResponse>();
    let timeout: Timeout | undefined;
    // wait for response
    const handlerIndex = this.incomeResponsesEvent.addListener((
      response: ConnectionResponse
    ) => {
      // check if promised if fulfilled in case of timeout has exceeded
      if (promised.isFulfilled()) return;
      // listen only our response
      if (response.requestId !== request.requestId) return;

      // TODO: проверить что это response

      this.incomeResponsesEvent.removeListener(handlerIndex);
      clearTimeout(timeout as any);

      promised.resolve(response);

      // if (response.status === ConnectionStatus.responseError) {
      //   promised.reject(new Error(response.error));
      // }
      // else {
      //   promised.resolve(response);
      // }
    });

    timeout = setTimeout(() => {
      if (promised.isFulfilled()) return;

      this.incomeResponsesEvent.removeListener(handlerIndex);

      promised.reject(new Error(
        `WsServerConnection.request: Timeout of request has been exceeded ` +
        `of channel "${channel}"`
      ));
    }, this.config.config.requestTimeoutSec * 1000);

    return promised.promise;
  }

  onRequest(handler: ConnectionOnRequestHandler): number {
    const cbWrapper = (
      request: ConnectionRequest,
      sessionId: string
    ) => {
      try {
        handler(request, sessionId)
          .then((response: ConnectionResponse) => this.sendResponseBack(response, sessionId))
          .catch((e) => {
            this.sendErrorResponseBack(e, request, sessionId);
          });
      }
      catch (e) {
        this.sendErrorResponseBack(e, request, sessionId);
      }
    };

    return this.incomeRequestsEvent.addListener(cbWrapper);
  }

  removeListener(handlerIndex: number): void {
    this.incomeRequestsEvent.removeListener(handlerIndex);
  }


  protected handleIncomeMessage = (sessionId: string, data: Uint8Array) => {
    if (!isConnectionMessage(data)) return;

    const decodedMessage: ConnectionRequest | ConnectionResponse = decodeIncomeMessage(data);

    if (isRequest(decodedMessage)) {
      // request
      this.incomeRequestsEvent.emit(decodedMessage as ConnectionRequest, sessionId);
    }
    else {
      // response
      this.incomeResponsesEvent.emit(decodedMessage as ConnectionResponse, sessionId);
    }
  }


  protected async sendResponseBack(response: ConnectionResponse, sessionId: string) {
    const responseMessage: Uint8Array = encodeResponse(response);
    // TODO: отправить ответ
    await this.write(sessionId, responseMessage);
    // TODO: add timeout
  }

  protected sendErrorResponseBack(error: Error, request: ConnectionRequest, sessionId: string) {
    // TODO: отправить ответ
    // TODO: add timeout

    // const response: NetworkResponse = {
    //   requestId: request.requestId,
    //   status: NetworkStatus.errorMessage,
    //   body: new Uint8Array(stringToUint8Array(String(e))),
    // };
    //
    // this.sendResponse(port, response)
    //   .catch(this.log.error);
  }

}
