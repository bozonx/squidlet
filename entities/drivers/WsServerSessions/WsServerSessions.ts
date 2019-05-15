import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WS_SERVER_EVENTS} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {parseCookie} from '../../../system/helpers/strings';


// TODO: merge props with WsServer


export class WsServerSessions extends DriverBase<WebSocketServerProps> {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    if (!this.server) {
      throw new Error(`WebSocketServer.listeningPromise: ${this.closedMsg}`);
    }

    return this.server.listeningPromise;
  }

  private get wsServerIo(): WebSocketServerIo {
    return this.env.getIo('WebSocketServer') as any;
  }
  private server?: WsServerLogic;
  private get closedMsg() {
    return `Server "${this.props.host}:${this.props.port}" has been closed`;
  }


  protected willInit = async () => {
    this.server = new WsServerLogic(
      this.wsServerIo,
      this.props,
      this.onServerClosed,
      this.env.log.info,
      this.env.log.error
    );
  }

  protected appDidInit = async () => {
    this.server && this.server.init();

    this.server.onConnection((connectionId: string, connectionParams: ConnectionParams) => {
      if (connectionParams.headers.cookie) {
        const parsedCookie = parseCookie(connectionParams.headers.cookie);

        if (parsedCookie.sessionId) {

          if (this.env.system.sessions.isSessionActive(parsedCookie.sessionId)) {
            // TODO: use session
          }
          else {
            // TODO: new session
          }

        }
        else {
          // TODO: new session
        }
      }

      // TODO: new session
    });
  }

  destroy = async () => {
    if (!this.server) return;

    await this.server.destroy();
    delete this.server;
  }


  send(sessionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.server) throw new Error(`WebSocketServer.send: ${this.closedMsg}`);

    return this.server.send(connectionId, data);
  }

  onMessage(sessionId: string, cb: OnMessageHandler): number {
    if (!this.server) throw new Error(`WebSocketServer.onMessage: ${this.closedMsg}`);

    return this.server.onMessage(connectionId, cb);
  }

  onNewSession(cb: (sessionId: string, connectionParams: ConnectionParams) => void): number {
    // if (!this.server) throw new Error(`WebSocketServer.onConnection: ${this.closedMsg}`);
    //
    // return this.server.onConnection(cb);
  }

  onSessionClose(cb: (sessionId: string) => void): number {
    if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);

    return this.server.onConnectionClose(cb);
  }

  // TODO: review
  removeListener(eventName: WS_SERVER_EVENTS, handlerIndex: number) {
    if (!this.server) return;

    this.server.removeListener(eventName, handlerIndex);
  }


  private onServerClosed = () => {
    this.env.log.error(`WebSocketServer: ${this.closedMsg}, you can't manipulate it any more!`);
  }

}

export default class Factory extends DriverFactoryBase<WsServerSessions> {
  protected DriverClass = WsServerSessions;

  // TODO: поидее можно выдавать всего новый инстанс если используется драйвер WsServer

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}


// /**
//  * Force closing a connection
//  */
// closeSession(sessionId: string, code: number, reason: string) {
//   if (!this.server) return;
//
//   this.server.closeConnection(connectionId, code, reason);
// }
