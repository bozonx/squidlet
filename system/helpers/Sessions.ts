import IndexedEvents from './IndexedEvents';


/**
 * Sessions allows not to operate connection itself because they might reconnect.
 * External code have to pass sessionId to client.
 */
export default class Sessions {
  private readonly sessionTimeout: number;
  private readonly generateUniqId: () => string;
  private readonly closeEvents = new IndexedEvents<(sessionId: string) => void>();
  private sessionStorage: {[index: string]: any} = {};
  private closeConnectionTimeouts: {[index: string]: any} = {};
  private activeSession: {[index: string]: true} = {};


  constructor(sessionTimeout: number, generateUniqId: () => string) {
    this.sessionTimeout = sessionTimeout;
    this.generateUniqId = generateUniqId;
  }

  destroy() {
    this.closeEvents.removeAll();

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
   * @param shortConnection - if true then session is established by caliing aliveSession()
   *                          if false then session is established while closedConnection()
   * @returns sessionId
   */
  newConnection(shortConnection: boolean = false): string {
    const sessionId: string = this.generateUniqId();

    // if it is short connection like http then wait to a next connection to renew the session.
    // Otherwise session will be closed
    if (shortConnection) this.newSessionTimeout(sessionId);

    // mark session active
    this.activeSession[sessionId] = true;

    return sessionId;
  }

  /**
   * If long connection is reconnected then timout of session will be cleared
   */
  reconnect(sessionId: string) {
    clearTimeout(this.closeConnectionTimeouts[sessionId]);
    delete this.closeConnectionTimeouts[sessionId];
  }

  /**
   * Call this method if you use connection like websocket on connection close.
   */
  closedConnection(sessionId: string) {
    // wait timeout to decide that session is elapsed
    this.newSessionTimeout(sessionId);
  }

  /**
   * Call this method on each received data of connection with this sessionId
   * to mark that session is alive.
   */
  renewShortConnection(sessionId: string) {
    this.newSessionTimeout(sessionId);
  }

  onSessionClossed(cb: (sessionId: string) => void): number {
    return this.closeEvents.addListener(cb);
  }

  removeSessionClosedListener(handlerIndex: number) {
    this.closeEvents.removeListener(handlerIndex);
  }

  getStorage(sessionId: string): any | undefined {
    return this.sessionStorage[sessionId];
  }

  setStorage(sessionId: string, data: any) {
    this.sessionStorage[sessionId] = data;
  }


  private newSessionTimeout(sessionId: string) {
    clearTimeout(this.closeConnectionTimeouts[sessionId]);
    delete this.closeConnectionTimeouts[sessionId];

    this.closeConnectionTimeouts[sessionId] = setTimeout(() => {
      this.closeSession(sessionId);
    }, this.sessionTimeout);
  }

  private closeSession(sessionId: string) {
    clearTimeout(this.closeConnectionTimeouts[sessionId]);
    this.closeEvents.emit(sessionId);
    delete this.closeConnectionTimeouts[sessionId];
    delete this.sessionStorage[sessionId];
    delete this.activeSession[sessionId];
  }

}