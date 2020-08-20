import Connection, {
  ConnectionIncomeRequestHandler,
  ConnectionIncomeResponseHandler,
  ConnectionRequest,
  ConnectionResponse,
  ConnectionStatus
} from 'system/interfaces/Connection';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import IndexedEvents from 'system/lib/IndexedEvents';
import ServiceBase from 'system/base/ServiceBase';
import {
  makeConnectionRequest,
  makeConnectionRequestMessage,
  makeConnectionResponseMessage
} from 'system/lib/connectionHelpers';

import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


interface Props extends WsServerSessionsProps {
}


export default class WsServerConnection extends ServiceBase<Props> implements Connection {
  server!: WsServerSessions;
  private incomeMessagesEvent = new IndexedEvents<ConnectionIncomeResponseHandler>();


  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage((sessionId: string, data: string | Uint8Array) => {
      // TODO: add
      // TODO: decode and make response
      // TODO: use incomeMessagesEvent
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
    // wait for response
    return new Promise((resolve, reject) => {
      const handlerIndex = this.incomeMessagesEvent.addListener((
        response: ConnectionResponse
      ) => {
        // listen only our response
        if (response.requestId !== request.requestId) return;

        this.incomeMessagesEvent.removeListener(handlerIndex);

        // TODO: или может всегда делать resolve ????
        if (response.status === ConnectionStatus.responseError) {
          reject(new Error(response.error));
        }
        else {
          resolve(response);
        }
      });

      // TODO: add timeout
    });
  }

  // TODO: когда сессия закончится удалять всех слушателей данной сессии
  onRequest(sessionId: string, channel: number, handler: ConnectionIncomeRequestHandler): number {
    // TODO: обработка ошибок самого cbWrapper
    // TODO: не известно что это responce или request
    const cbWrapper = async (request: ConnectionRequest) => {
      // TODO: как проверить сессию что она наша?
      // check for our channel
      if (request.channel !== channel) return;

      // TODO: првоерить что это request

      let response: ConnectionResponse;

      try {
        response = await handler(request);
      }
      catch (e) {
        // TODO: что делать в лучае ошибки ???
      }

      const responseMessage: Uint8Array = makeConnectionResponseMessage(response);
      // TODO: отправить ответ
      await this.server.send(sessionId, responseMessage);
    };

    return this.incomeMessagesEvent.addListener(cbWrapper);

    // TODO: add timeout
  }

  removeListener(handlerIndex: number): void {
    this.incomeMessagesEvent.removeListener(handlerIndex);
  }

}
