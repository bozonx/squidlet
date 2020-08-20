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
  isRequest,
  makeConnectionRequest,
  makeConnectionRequestMessage,
  makeConnectionResponseMessage
} from 'system/lib/connectionHelpers';
import Promised from 'system/lib/Promised';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


type Timeout = NodeJS.Timeout;
type IncomeRequestHandler = (request: ConnectionRequest, sessionId: string) => void;

interface Props extends WsServerSessionsProps {
}


export default class WsServerConnection extends ServiceBase<Props> implements Connection {
  server!: WsServerSessions;
  // TODO: какой тип???
  private incomeMessagesEvent = new IndexedEvents();
  private incomeRequestsEvent = new IndexedEvents<IncomeRequestHandler>();


  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage((sessionId: string, data: string | Uint8Array) => {
      // TODO: add
      // TODO: decode and make response
      // TODO: use incomeMessagesEvent
      if (!isRequest(request)) return;
    });
    this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
      // TODO: add
    });
    this.server.onSessionClose((sessionId: string) => {
      // TODO: add
    });
  }


  async request(sessionId: string, channel: number, data: Uint8Array): Promise<ConnectionResponse> {
    const request: ConnectionRequest = makeConnectionRequest(channel, data);
    const requestMessage: Uint8Array = makeConnectionRequestMessage(request);
    // send request and wait while sending is finished
    await this.server.send(sessionId, requestMessage);

    const promised = new Promised<ConnectionResponse>();
    let timeout: Timeout | undefined;

    // wait for response
    const handlerIndex = this.incomeMessagesEvent.addListener((
      response: ConnectionResponse
    ) => {
      // check if promised if fulfilled in case of timeout has exceeded
      if (promised.isFulfilled()) return;
      // listen only our response
      if (response.requestId !== request.requestId) return;

      this.removeListener(handlerIndex);
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

      this.removeListener(handlerIndex);

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
      // TODO: add timeout на выполнение хэндлера
      try {
        handler(request, sessionId)
          .then((response: ConnectionResponse) => this.sendResponseBack(response, sessionId))
          .catch((e) => {
            // TODO: что делать в лучае ошибки ??? сформировать ошибочный ответ и отправить
          });
      }
      catch (e) {
        // TODO: что делать в лучае ошибки ??? сформировать ошибочный ответ и отправить
      }
    };

    return this.incomeRequestsEvent.addListener(cbWrapper);
  }

  removeListener(handlerIndex: number): void {
    this.incomeMessagesEvent.removeListener(handlerIndex);
  }


  private async sendResponseBack(response: ConnectionResponse, sessionId: string) {
    const responseMessage: Uint8Array = makeConnectionResponseMessage(response);
    // TODO: отправить ответ
    await this.server.send(sessionId, responseMessage);
    // TODO: add timeout
  }

}
