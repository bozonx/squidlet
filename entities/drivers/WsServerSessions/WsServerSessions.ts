import DriverFactoryBase from 'system/baseDrivers/DriverFactoryBase';
import DriverBase from 'system/baseDrivers/DriverBase';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {parseCookie} from 'system/helpers/strings';
import {GetDriverDep} from 'system/entities/EntityBase';
import IndexedEventEmitter from 'system/helpers/IndexedEventEmitter';
import {getKeyOfObject} from 'system/helpers/collections';
import {omit} from 'system/helpers/lodashLike';
import {WsServer} from '../WsServer/WsServer';


export enum WS_SESSIONS_EVENTS {
  newSession,
  sessionClose,
  message
}


export interface WsServerSessionsProps extends WebSocketServerProps {
  expiredSec: number;
}


export class WsServerSessions extends DriverBase<WsServerSessionsProps> {
  private readonly events = new IndexedEventEmitter();

  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this.server.listeningPromise;
  }
  private get server(): WsServer {
    return this.depsInstances.server;
  }

  // like {sessionId: connectionId}
  private sessionConnections: {[index: string]: string} = {};


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.server = await getDriverDep('WsServer')
      .getInstance(omit(this.props, 'expiredSec'));

    this.server.onConnection(this.handleNewConnection);
    this.server.onConnectionClose((connectionId: string) => {
      const sessionId: string | undefined = getKeyOfObject(this.sessionConnections, connectionId);

      if (!sessionId) return;

      // remove connection linked to session
      delete this.sessionConnections[sessionId];
    });
    this.server.onMessage((connectionId: string, data: string | Uint8Array) => {
      const sessionId: string | undefined = getKeyOfObject(this.sessionConnections, connectionId);

      if (!sessionId) return;

      this.events.emit(WS_SESSIONS_EVENTS.message, sessionId, data);
    });

    this.env.system.sessions.onSessionClossed((sessionId) => {
      // listen only ours session
      if (!Object.keys(this.sessionConnections).includes(sessionId)) return;

      delete this.sessionConnections[sessionId];
      this.events.emit(WS_SESSIONS_EVENTS.sessionClose, sessionId);
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
      throw new Error(`WsServerSessions.send: Session ${sessionId} is inactive`);
    }
    else if (!this.sessionConnections[sessionId]) {
      throw new Error(`WsServerSessions.send: Can't find a connection of session "${sessionId}"`);
    }

    return this.server.send(this.sessionConnections[sessionId], data);
  }

  onMessage(cb: (sessionId: string, data: string | Uint8Array) => void): number {
    return this.events.addListener(WS_SESSIONS_EVENTS.message, cb);
  }

  /**
   * On created new session at handshake.
   * Connection isn't established at this moment!
   */
  onNewSession(cb: (sessionId: string, connectionParams: ConnectionParams) => void): number {
    return this.events.addListener(WS_SESSIONS_EVENTS.newSession, cb);
  }

  onSessionClose(cb: (sessionId: string) => void): number {
    return this.events.addListener(WS_SESSIONS_EVENTS.sessionClose, cb);
  }

  removeListener(eventName: WS_SESSIONS_EVENTS, handlerIndex: number) {
    this.events.removeListener(eventName, handlerIndex);
  }


  /**
   * Set session id to cookie of client if it doesn't have or session is inactive
   */
  private handleHeaders = (headers: {[index: string]: string}, request: ConnectionParams) => {

    // TODO: headers это массив или объект ???

    const parsedCookie: {SESSIONID?: string} = parseCookie(request.headers.cookie);

    if (parsedCookie.SESSIONID && this.env.system.sessions.isSessionActive(parsedCookie.SESSIONID)) {
      // if session exists - recover it
      return this.env.system.sessions.recoverSession(parsedCookie.SESSIONID);
    }

    // or create a new session

    const sessionId: string = this.env.system.sessions.newSession(this.props.expiredSec);
    headers['Set-Cookie'] = `SESSIONID=${sessionId}`;
    // rise a new session event
    this.events.emit(WS_SESSIONS_EVENTS.newSession, sessionId, request);

    // TODO: что если создали новую сессию а соединение так и не установилось????
    //       Тогда наверное не подниметься connection close event

  }

  private handleNewConnection = (
    connectionId: string,
    request: ConnectionParams,
  ) => {
    const requestCookie: {SESSIONID?: string} = parseCookie(request.headers.cookie);

    // TODO: проверить будет ли в request новый cookie который только установили в headers ???

    //const upgradeCookie: {SESSIONID?: string} = parseCookie(upgradeReq && upgradeReq.headers.cookie);
    //const sessionId: string | undefined = requestCookie.SESSIONID || upgradeCookie.SESSIONID;
    const sessionId: string | undefined = requestCookie.SESSIONID;

    if (!sessionId) {
      return this.env.log.error(`WsServerSessions.handleNewConnection: Client doesn't have a SESSIONID cookie`);
    }

    this.sessionConnections[sessionId] = connectionId;
  }

}

export default class Factory extends DriverFactoryBase<WsServerSessions> {
  protected DriverClass = WsServerSessions;

  // TODO: поидее можно выдавать всего новый инстанс если используется драйвер WsServer

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}



// onMessage(cb: (sessionId: string, data: string | Uint8Array) => void): number {
//   return this.events.addListener(WS_SESSIONS_EVENTS.message, cb);
//
//   // if (!this.env.system.sessions.isSessionActive(sessionId)) {
//   //   throw new Error(`WsServerSessions.onMessage: Session ${sessionId} is inactive`);
//   // }
//   //
//   // return this.events.addListener(WS_SESSIONS_EVENTS.message, (msgSessionId: string, data: string | Uint8Array) => {
//   //   if (msgSessionId === sessionId) cb(data);
//   // });
// }

// /**
//  * Force closing a connection
//  */
// closeSession(sessionId: string, code: number, reason: string) {
//   if (!this.server) return;
//
//   this.server.closeConnection(connectionId, code, reason);
// }

// onSessionClose(sessionId: string, cb: () => void): number {
//   if (!this.env.system.sessions.isSessionActive(sessionId)) {
//     throw new Error(`WsServerSessions.onSessionClose: Session ${sessionId} is inactive`);
//   }
//
//   return this.env.system.sessions.onSessionClossed((closedSession: string) => {
//     if (closedSession === sessionId) cb();
//   });
// }
