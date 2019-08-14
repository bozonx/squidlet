import DriverFactoryBase from 'system/entities/DriverFactoryBase';
import DriverBase from 'system/entities/DriverBase';
import {ConnectionParams} from 'system/interfaces/io/WebSocketServerIo';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import {parseCookie} from 'system/lib/strings';
import {GetDriverDep} from 'system/entities/EntityBase';
import IndexedEventEmitter from 'system/lib/IndexedEventEmitter';
import {getKeyOfObject} from 'system/lib/collections';
import {omit} from 'system/lib/lodashLike';
import {WsServer} from '../WsServer/WsServer';


export enum WS_SESSIONS_EVENTS {
  newSession,
  sessionClose,
  message
}

export interface WsServerSessionsProps extends WebSocketServerProps {
  expiredSec: number;
}

const SESSIONID_COOKIE = 'SESSIONID';


export class WsServerSessions extends DriverBase<WsServerSessionsProps> {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this.server.listeningPromise;
  }

  private readonly events = new IndexedEventEmitter();
  private get server(): WsServer {
    return this.depsInstances.server;
  }
  // like {sessionId: connectionId} - null means connection is closed
  private sessionConnections: {[index: string]: string | null} = {};


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.server = await getDriverDep('WsServer')
      .getInstance(omit(this.props, 'expiredSec'));

    this.server.onConnection(this.handleNewConnection);
    this.server.onConnectionClose((connectionId: string) => {
      // handle only ours active sessions
      const sessionId: string | undefined = getKeyOfObject(this.sessionConnections, connectionId);

      if (!sessionId) return;

      // clear connectionId
      this.sessionConnections[sessionId] = null;
    });
    this.server.onMessage((connectionId: string, data: string | Uint8Array) => {
      // handle only ours active sessions
      const sessionId: string | undefined = getKeyOfObject(this.sessionConnections, connectionId);

      if (!sessionId) return;

      this.events.emit(WS_SESSIONS_EVENTS.message, sessionId, data);
    });

    this.context.sessions.onSessionClosed((sessionId) => {
      // listen only ours session
      if (!Object.keys(this.sessionConnections).includes(sessionId)) return;

      delete this.sessionConnections[sessionId];
      this.events.emit(WS_SESSIONS_EVENTS.sessionClose, sessionId);
    });
  }

  destroy = async () => {
    for (let sessionId of Object.keys(this.sessionConnections)) {
      this.context.sessions.shutDownImmediately(sessionId);
    }

    delete this.sessionConnections;
    await this.server.destroy();
    this.events.destroy();
  }


  send(sessionId: string, data: string | Uint8Array): Promise<void> {
    if (!this.context.sessions.isSessionActive(sessionId)) {
      throw new Error(`WsServerSessions.send: Session ${sessionId} is inactive`);
    }
    else if (!this.sessionConnections[sessionId]) {
      throw new Error(`WsServerSessions.send: Can't find a connection of session "${sessionId}"`);
    }

    return this.server.send(this.sessionConnections[sessionId] as string, data);
  }

  /**
   * Close connection of session
   */
  async close(sessionId: string) {
    const connectionId = this.sessionConnections[sessionId];

    if (!connectionId) return;

    await this.server.closeConnection(connectionId, 0, 'Close session request');

    this.context.sessions.shutDownImmediately(sessionId);

    delete this.sessionConnections[sessionId];
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


  private handleNewConnection = this.wrapErrors(async (
    connectionId: string,
    request: ConnectionParams,
  ) => {
    const requestCookie: { [SESSIONID_COOKIE]?: string } = parseCookie(request.headers.cookie);
    let sessionId: string | undefined = requestCookie[SESSIONID_COOKIE];

    if (sessionId && this.context.sessions.isSessionActive(sessionId)) {
      // if session exists - recover it
      this.context.sessions.recoverSession(sessionId);
    }
    else {
      // create a new session if there isn't cookie of session is inactive
      sessionId = this.context.sessions.newSession(this.props.expiredSec);

      const cookie = `${SESSIONID_COOKIE}=${sessionId}`;

      await this.server.setCookie(connectionId, cookie);
    }

    this.sessionConnections[sessionId] = connectionId;
  });

}


export default class Factory extends DriverFactoryBase<WsServerSessions> {
  protected DriverClass = WsServerSessions;

  protected instanceIdCalc = (props: {[index: string]: any}): string => {
    return `${props.host}:${props.port}`;
  }
}



// /**
//  * Set session id to cookie of client if it doesn't have or session is inactive
//  */
// private handleHeaders = this.wrapErrors(async (headers: {[index: string]: string}, request: ConnectionParams) => {
//
//   // T-O-D-O: headers это массив или объект ???
//
//   const parsedCookie: {SESSIONID?: string} = parseCookie(request.headers.cookie);
//
//   if (parsedCookie.SESSIONID && this.context.sessions.isSessionActive(parsedCookie.SESSIONID)) {
//     // if session exists - recover it
//     return this.context.sessions.recoverSession(parsedCookie.SESSIONID);
//   }
//
//   // or create a new session
//
//   const sessionId: string = this.context.sessions.newSession(this.props.expiredSec);
//   headers['Set-Cookie'] = `SESSIONID=${sessionId}`;
//   // rise a new session event
//   this.events.emit(WS_SESSIONS_EVENTS.newSession, sessionId, request);
//
//   // T-O-D-O: что если создали новую сессию а соединение так и не установилось????
//   //       Тогда наверное не подниметься connection close event
//
// })

// onMessage(cb: (sessionId: string, data: string | Uint8Array) => void): number {
//   return this.events.addListener(WS_SESSIONS_EVENTS.message, cb);
//
//   // if (!this.context.sessions.isSessionActive(sessionId)) {
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
//   if (!this.context.sessions.isSessionActive(sessionId)) {
//     throw new Error(`WsServerSessions.onSessionClose: Session ${sessionId} is inactive`);
//   }
//
//   return this.context.sessions.onSessionClossed((closedSession: string) => {
//     if (closedSession === sessionId) cb();
//   });
// }
