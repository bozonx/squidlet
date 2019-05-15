/**
 * Make session of connections to not to operate connection itself because they might reconnect.
 */
export default class Sessions {
  private readonly sessionTimeout: number;
  private sessionStorage: {[indes: string]: any} = {};


  constructor(sessionTimeout: number) {
    this.sessionTimeout = sessionTimeout;
  }

  destroy() {
    this.sessionStorage = {};
  }


  /**
   * Call this method on new connection to your server
   * @param connectionId
   * @returns sessionId
   */
  newConnection(connectionId: string): string {

  }

  onSessionClossed(cb: (sessionId: string) => void) {

  }

  getStorage(sessionId: string): any | undefined {
    return this.sessionStorage[sessionId];
  }

  setStorage(sessionId: string, data: any) {
    this.sessionStorage[sessionId] = data;
  }

}
