import DriverFactoryBase from 'system/base/DriverFactoryBase';
import DriverBase from 'system/base/DriverBase';
import ChannelDriver, {
  ChannelIncomeRequestHandler,
  ChannelRequest,
  ChannelSendResponse
} from 'system/interfaces/ChannelDriver';
import {WsServer} from '../WsServer/WsServer';
import {ConnectionParams} from '../../../system/interfaces/io/WebSocketServerIo';
import {WsServerSessions} from '../WsServerSessions/WsServerSessions';
import IndexedEvents from '../../../system/lib/IndexedEvents';


interface Props {
  // TODO: решить какие будут props, наверное те что для WsServer driver
}


export class WsServerChannel extends DriverBase<Props> implements ChannelDriver {
  server!: WsServerSessions;
  // TODO: add type
  private incomeMessagesEvent = new IndexedEvents();


  init = async () => {
    // it creates a new server on specified host:port
    this.server = await this.context.getSubDriver('WsServerSessions', this.props);

    this.server.onMessage((sessionId: string, data: string | Uint8Array) => {
      // TODO: add
      // TODO: use incomeMessagesEvent
    });
    this.server.onNewSession((sessionId: string, connectionParams: ConnectionParams) => {
      // TODO: add
    });
    this.server.onSessionClose((sessionId: string) => {
      // TODO: add
    });
  }


  async request(sessionId: string, channel: number, data: Uint8Array): Promise<ChannelSendResponse> {
    // TODO: сформировать requestId
    // TODO: сформировать запрос
    const request: ChannelRequest = makeChannelRequest(channel, data);
    const requestMessage: Uint8Array = makeChannelRequestMessage(request);
    // wait while request is finished
    await this.server.send(sessionId, requestMessage);

    // try {
    //   await this.server.send(sessionId, requestMessage);
    // }
    // catch (e) {
    //   throw e;
    // }
    // finally {
    //   this.incomeMessagesEvent.removeListener(listenHandler);
    // }

    return new Promise((resolve, reject) => {
      const listenHandler = this.incomeMessagesEvent.addListener(() => {
        // TODO: listen to message from server which is has the same requestId
        // TODO: decode and make response
        // TODO: remove listenHandler
      });

      // TODO: add timeout
    });
  }

  onRequest(channel: number, handler: ChannelIncomeRequestHandler): number {
    // TODO: передавать session id в handler
  }

  removeListener(handlerIndex: number): void {
    // TODO: add
  }


  // // it fulfils when server is start listening
  // get listeningPromise(): Promise<void> {
  //   if (!this.server) {
  //     throw new Error(`WebSocketServer.listeningPromise: ${this.closedMsg}`);
  //   }
  //
  //   return this.server.listeningPromise;
  // }
  //
  // private get wsServerIo(): WebSocketServerIo {
  //   return this.context.getIo('WebSocketServer') as any;
  // }
  // private server?: WsServerLogic;
  // private get closedMsg() {
  //   return `Server "${this.props.host}:${this.props.port}" has been already closed`;
  // }
  //
  //
  // init = async () => {
  //   this.server = new WsServerLogic(
  //     this.wsServerIo,
  //     this.props,
  //     this.onServerClosed,
  //     this.log.debug,
  //     this.log.info,
  //     this.log.error
  //   );
  //
  //   await this.server.init();
  // }
  //
  // // protected appDidInit = async () => {
  // //   this.server && await this.server.init();
  // // }
  //
  // destroy = async () => {
  //   if (!this.server) return;
  //
  //   await this.server.destroy();
  //   delete this.server;
  // }
  //
  //
  // send(connectionId: string, data: string | Uint8Array): Promise<void> {
  //   if (!this.server) throw new Error(`WebSocketServer.send: ${this.closedMsg}`);
  //
  //   return this.server.send(connectionId, data);
  // }
  //
  // // TODO: add closeServer ???
  //
  // /**
  //  * Force closing a connection
  //  */
  // async closeConnection(connectionId: string, code: number, reason: string): Promise<void> {
  //   if (!this.server) return;
  //
  //   await this.server.closeConnection(connectionId, code, reason);
  // }
  //
  // async destroyConnection(connectionId: string) {
  //   if (!this.server) return;
  //
  //   await this.server.destroyConnection(connectionId);
  // }
  //
  // async setCookie(connectionId: string, cookie: string) {
  //   if (!this.server) return;
  //
  //   await this.server.setCookie(connectionId, cookie);
  // }
  //
  // onMessage(cb: (connectionId: string, data: string | Uint8Array) => void): number {
  //   if (!this.server) throw new Error(`WebSocketServer.onMessage: ${this.closedMsg}`);
  //
  //   return this.server.onMessage(cb);
  // }
  //
  // onConnection(
  //   cb: (connectionId: string, connectionParams: ConnectionParams) => void
  // ): number {
  //   if (!this.server) throw new Error(`WebSocketServer.onConnection: ${this.closedMsg}`);
  //
  //   return this.server.onConnection(cb);
  // }
  //
  // /**
  //  * Ordinary connection close.
  //  * It won't be called on destroy
  //  */
  // onConnectionClose(cb: (connectionId: string) => void): number {
  //   if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);
  //
  //   return this.server.onConnectionClose(cb);
  // }
  //
  // removeListener(handlerIndex: number) {
  //   if (!this.server) return;
  //
  //   this.server.removeListener(handlerIndex);
  // }
  //
  //
  // private onServerClosed = () => {
  //   this.log.error(`WebSocketServer: ${this.closedMsg}, you can't manipulate it any more!`);
  // }

}

export default class Factory extends DriverFactoryBase<WsServerChannel, Props> {
  protected SubDriverClass = WsServerChannel;
  protected instanceId = (props: Props): string => {
    // TODO: review
    return `${props.host}:${props.port}`;
  }
}
