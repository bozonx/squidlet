import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {OnMessageHandler} from 'system/interfaces/io/WebSocketClientIo';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {parseCookie, stringifyCookie} from 'system/helpers/strings';
import {GetDriverDep} from 'system/entities/EntityBase';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {WsServer} from '../WsServer/WsServer';


export enum WS_SESSIONS_EVENTS {
  newSession,
  message
}


export interface WsServerSessionsProps extends WebSocketServerProps {
  expiredSec: number;
}

type NewSessionHandler = (sessionId: string, connectionParams: ConnectionParams) => void;
//type MessageHandler = (sessionId: string, data: string | Uint8Array) => void;


export class WsServerSessions extends DriverBase<WsServerSessionsProps> {
  private readonly events = new IndexedEventEmitter();

  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this.server.listeningPromise;
  }
  private get server(): WsServer {
    return this.depsInstances.server as any;
  }

  // like {sessionId: connectionId}
  private sessionConnections: {[index: string]: string} = {};


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.server = await getDriverDep('WsServer')
      .getInstance(this.props);

    this.server.onConnection(this.handleNewConnection);
    this.server.onConnectionClose((connectionId: string) => {
      // TODO: при закрытии сессии очищать sessionConnections
      // TODO: удалять хэндлеры сообщений
    });

    this.env.system.sessions.onSessionClossed((sessionId) => {
      // TODO: remove sessionConnections[sessionId]
      // TODO: наверное поднять событие?
    });
  }

  protected appDidInit = async () => {
    return this.server.init();
  }

  destroy = async () => {
    await this.server.destroy();
    this.events.destroy();
    delete this.sessionConnections;
  }


  send(sessionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.env.system.sessions.isSessionActive(sessionId)) {
      throw new Error(`WebSocketServer.onMessage: Session ${sessionId} is inactive`);
    }
    else if (!this.sessionConnections[sessionId]) {
      throw new Error(`WebSocketServer.onMessage: Can't find a connection of session "${sessionId}"`);
    }

    return this.server.send(this.sessionConnections[sessionId], data);
  }

  onMessage(sessionId: string, cb: OnMessageHandler): number {
    if (!this.env.system.sessions.isSessionActive(sessionId)) {
      throw new Error(`WebSocketServer.onMessage: Session ${sessionId} is inactive`);
    }

    return this.events.addListener(WS_SESSIONS_EVENTS.message, (msgSessionId: string, data: string | Uint8Array) => {
      if (msgSessionId === sessionId) cb(data);
    });
  }

  onNewSession(cb: NewSessionHandler): number {
    return this.events.addListener(WS_SESSIONS_EVENTS.newSession, cb);
  }

  onSessionClose(sessionId: string, cb: () => void): number {
    if (!this.env.system.sessions.isSessionActive(sessionId)) {
      throw new Error(`WebSocketServer.onMessage: Session ${sessionId} is inactive`);
    }

    return this.env.system.sessions.onSessionClossed((closedSession: string) => {
      if (closedSession === sessionId) cb();
    });
  }

  removeListener(eventName: WS_SESSIONS_EVENTS, handlerIndex: number) {
    this.events.removeListener(eventName, handlerIndex);
  }


  private handleNewConnection = (connectionId: string, connectionParams: ConnectionParams) => {
    const parsedCookie: {sessionId?: string} = parseCookie(connectionParams.headers.cookie);

    // create a new session
    if (!parsedCookie.sessionId || !this.env.system.sessions.isSessionActive(parsedCookie.sessionId)) {
      return this.createNewSession(connectionId, connectionParams);
    }

    // continue existent session on reconnect
    this.env.system.sessions.recoverSession(parsedCookie.sessionId);
    this.setupNewConnection(parsedCookie.sessionId, connectionId);

  }

  private createNewSession(connectionId: string, connectionParams: ConnectionParams) {
    const sessionId: string = this.env.system.sessions.newSession(this.props.expiredSec);

    this.setupNewConnection(sessionId, connectionId);

    const cookieString: string = stringifyCookie({ sessionId });

    // TODO: send cookie !!!!

    // rise a new session event
    this.events.emit(WS_SESSIONS_EVENTS.newSession, sessionId, connectionParams);
  }

  private setupNewConnection(sessionId: string, connectionId: string) {
    this.sessionConnections[sessionId] = connectionId;

    this.server.onMessage(connectionId, (data: string | Uint8Array) => {
      this.events.emit(WS_SESSIONS_EVENTS.message, sessionId, data);
    });
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
