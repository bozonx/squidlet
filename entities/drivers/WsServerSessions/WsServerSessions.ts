import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import WsServerLogic, {WS_SERVER_EVENTS} from './WsServerLogic';
import WebSocketServerIo, {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {parseCookie} from '../../../system/helpers/strings';
import IndexedEvents from '../../../system/helpers/IndexedEvents';


// TODO: merge props with WsServer
// TODO: лучше наверное использовать драйвер а не server logic ?
// TODO: может всетаки лучше использовать Sessions локально. Тогда можно вешаться на его события.
//       И удалять сессии при дестрое


export interface WsServerSessionsProps extends WebSocketServerProps {
  expiredSec: number;
}

type NewSessionHandler = (sessionId: string, connectionParams: ConnectionParams) => void;
//type MessageHandler = (sessionId: string, data: string | Uint8Array) => void;


export class WsServerSessions extends DriverBase<WsServerSessionsProps> {
  private readonly newSessionEvent = new IndexedEvents<NewSessionHandler>();
  private readonly messageEvent = new IndexedEvents<(sessionId: string, data: string | Uint8Array) => void>();

  // TODO: review
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
  // like {sessionId: connectionId}
  private sessionConnections: {[index: string]: string} = {};


  protected willInit = async () => {
    this.server = new WsServerLogic(
      this.wsServerIo,
      this.props,
      this.onServerClosed,
      this.env.log.info,
      this.env.log.error
    );

    this.server.onConnection(this.handleNewConnection);
    this.server.onConnectionClose((connectionId: string) => {
      // TODO: при закрытии сессии очищать sessionConnections
      // TODO: удалять хэндлеры сообщений
    });
  }

  protected appDidInit = async () => {
    this.server && this.server.init();
  }

  destroy = async () => {
    if (!this.server) return;

    await this.server.destroy();
    delete this.server;
  }


  send(sessionId: string, data: string | Uint8Array): Promise<void> {

    // TODO: remake

    if (!this.server) throw new Error(`WebSocketServer.send: ${this.closedMsg}`);

    return this.server.send(connectionId, data);
  }

  onMessage(sessionId: string, cb: OnMessageHandler): number {
    if (!this.server) throw new Error(`WebSocketServer.onMessage: ${this.closedMsg}`);
    if (!this.env.system.sessions.isSessionActive(sessionId)) {
      throw new Error(`WebSocketServer.onMessage: Session ${sessionId} is inactive`);
    }

    return this.messageEvent.addListener((msgSessionId: string, data: string | Uint8Array) => {
      if (msgSessionId === sessionId) cb(data);
    });
  }

  onNewSession(cb: NewSessionHandler): number {
    return this.newSessionEvent.addListener(cb);
  }

  onSessionClose(cb: (sessionId: string) => void): number {

    // TODO: remake

    if (!this.server) throw new Error(`WebSocketServer.onConnectionClose: ${this.closedMsg}`);

    return this.server.onConnectionClose(cb);
  }

  // TODO: review
  removeListener(eventName: WS_SERVER_EVENTS, handlerIndex: number) {
    if (!this.server) return;

    this.server.removeListener(eventName, handlerIndex);
  }


  private handleNewConnection = (connectionId: string, connectionParams: ConnectionParams) => {
    const parsedCookie: {sessionId?: string} = parseCookie(connectionParams.headers.cookie);

    if (parsedCookie.sessionId && this.env.system.sessions.isSessionActive(parsedCookie.sessionId)) {
      this.env.system.sessions.recoverSession(parsedCookie.sessionId);
      this.setupNewConnection(parsedCookie.sessionId, connectionId);

      return;
    }

    const newSessionId: string = this.env.system.sessions.newSession(this.props.expiredSec);

    this.setupNewConnection(newSessionId, connectionId);

    // rise a new session event
    this.newSessionEvent.emit(newSessionId, connectionParams);
  }

  private setupNewConnection(sessionId: string, connectionId: string) {
    this.sessionConnections[sessionId] = connectionId;

    this.server.onMessage(connectionId, (data: string | Uint8Array) => {
      this.messageEvent.emit(sessionId, data);
    });
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
