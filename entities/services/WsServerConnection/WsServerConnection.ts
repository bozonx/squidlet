import Connection, {
  ConnectionOnRequestHandler,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEvents from 'system/lib/IndexedEvents';
import ServiceBase from 'system/base/ServiceBase';
import {
  makeConnectionRequest,
  encodeRequest,
  encodeResponse,
  decodeIncomeMessage,
  isRequest
} from 'system/lib/connectionHelpers';
import Promised from 'system/lib/Promised';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


type Timeout = NodeJS.Timeout;
type IncomeRequestHandler = (request: ConnectionRequest, sessionId: string) => void;
type IncomeResponseHandler = (response: ConnectionResponse, sessionId: string) => void;

interface Props extends WsServerSessionsProps {
}


export default class WsServerConnection extends ServiceBase<Props> implements Connection {
  server!: WsServerSessions;
  private incomeRequestsEvent = new IndexedEvents<IncomeRequestHandler>();
  private incomeResponsesEvent = new IndexedEvents<IncomeResponseHandler>();


  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage(this.handleIncomeMessage);
    this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
      // TODO: add
    });
    this.server.onSessionClose((sessionId: string) => {
      // TODO: add
    });
  }


  async request(sessionId: string, channel: number, data: Uint8Array): Promise<ConnectionResponse> {
    const request: ConnectionRequest = makeConnectionRequest(channel, data);
    const requestMessage: Uint8Array = encodeRequest(request);
    // send request and wait while sending is finished
    await this.server.send(sessionId, requestMessage);

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


  private async sendResponseBack(response: ConnectionResponse, sessionId: string) {
    const responseMessage: Uint8Array = encodeResponse(response);
    // TODO: отправить ответ
    await this.server.send(sessionId, responseMessage);
    // TODO: add timeout
  }

  private sendErrorResponseBack(error: Error, request: ConnectionRequest, sessionId: string) {
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

  private handleIncomeMessage = (sessionId: string, data: string | Uint8Array) => {
    if (!(data instanceof Uint8Array) || !data.length) return;

    // TODO: проверить заголовок чтобы определить что это комманда для connection

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

}
