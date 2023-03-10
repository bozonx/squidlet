type Timeout = NodeJS.Timeout;

import IndexedEvents from './IndexedEvents';
import {JsonTypes} from '../interfaces/Types';


/**
 * Sessions allows not to operate connection itself because they might reconnect.
 * External code has to pass sessionId to a client.
 */
export default class Sessions {
  private readonly generateUniqId: () => string;
  private readonly closeEvents = new IndexedEvents<(sessionId: string) => void>();
  // TODO: make immutable
  private sessionStorage: {[index: string]: {[index: string]: any}} = {};
  private closeConnectionTimeouts: {[index: string]: Timeout} = {};
  // TODO: review
  // like {sessionId: expireSec}
  private activeSession: {[index: string]: number} = {};


  constructor(generateUniqId: () => string) {
    this.generateUniqId = generateUniqId;
  }

  destroy() {
    this.closeEvents.destroy();

    for (let sessionId of Object.keys(this.closeConnectionTimeouts)) {
      clearTimeout(this.closeConnectionTimeouts[sessionId]);
    }

    this.sessionStorage = {};
    this.closeConnectionTimeouts = {};
    this.activeSession = {};
  }


  isSessionActive(sessionId: string): boolean {
    return Boolean(this.activeSession[sessionId]);
  }

  /**
   * Call this method on new connection to your server
   * @param expireSec - time to session expire in seconds
   * @param shortConnection - if true then session is established by caliing aliveSession()
   *                          if false then session is established while closedConnection()
   * @returns sessionId
   */
  newSession(expireSec: number, shortConnection: boolean = false): string {
    const sessionId: string = this.generateUniqId();

    // mark session active
    this.activeSession[sessionId] = expireSec;

    // if it is short connection like http then wait to a next connection to renew the session.
    // Otherwise session will be closed
    if (shortConnection) this.newSessionTimeout(sessionId);

    return sessionId;
  }

  /**
   * It uses on reconnect of long connections like websocket.
   * It clears current timeout of finishing of session.
   * You shouldn't use it for short connection mode like http
   */
  recoverSession(sessionId: string) {
    if (this.closeConnectionTimeouts[sessionId]) clearTimeout(this.closeConnectionTimeouts[sessionId]);

    delete this.closeConnectionTimeouts[sessionId];
  }

  /**
   * Call this method if you use connection like websocket on connection close.
   * Call this method on each received data of connection with this sessionId
   * to mark that session is alive.
   */
  waitForShutDown(sessionId: string) {
    // wait timeout to decide that session is elapsed
    this.newSessionTimeout(sessionId);
  }

  /**
   * Close session immediately but rise a close event
   */
  shutDownImmediately(sessionId: string) {
    this.closeEvents.emit(sessionId);
    this.destroySession(sessionId);
  }

  /**
   * Call it only when you are destroying your entity.
   */
  destroySession(sessionId: string) {
    if (this.closeConnectionTimeouts[sessionId]) clearTimeout(this.closeConnectionTimeouts[sessionId]);

    delete this.closeConnectionTimeouts[sessionId];
    delete this.sessionStorage[sessionId];
    delete this.activeSession[sessionId];
  }

  onSessionClosed(cb: (sessionId: string) => void): number {
    return this.closeEvents.addListener(cb);
  }

  removeSessionClosedListener(handlerIndex: number) {
    this.closeEvents.removeListener(handlerIndex);
  }

  getStorage(sessionId: string, key: string): JsonTypes | undefined {
    if (!this.sessionStorage[sessionId]) return;

    return this.sessionStorage[sessionId][key];
  }

  setStorage(sessionId: string, key: string, data?: JsonTypes) {
    if (!this.sessionStorage[sessionId]) this.sessionStorage[sessionId] = {};

    this.sessionStorage[sessionId][key] = data;
  }


  private newSessionTimeout(sessionId: string) {
    if (this.closeConnectionTimeouts[sessionId]) clearTimeout(this.closeConnectionTimeouts[sessionId]);

    delete this.closeConnectionTimeouts[sessionId];

    this.closeConnectionTimeouts[sessionId] = setTimeout(() => {
      this.closeEvents.emit(sessionId);
      this.destroySession(sessionId);
    }, this.activeSession[sessionId] * 1000);
  }

}
