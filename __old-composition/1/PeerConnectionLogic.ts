import Timeout = NodeJS.Timeout;

import IndexedEventEmitter from '../../../../squidlet-lib/src/IndexedEventEmitter';
import Promised from '../../../../squidlet-lib/src/Promised';


enum EVENTS {
  connected,
  disconnected,
}

const NO_PING_PROCESS = -1;

// TODO: после последнего запроса через какое-то время сделать ping

export default class PeerConnectionLogic {
  private events = new IndexedEventEmitter();
  private connectionPromised = new Promised<void>();
  // if error means host is unreachable
  private readonly pingCb: () => Promise<void>;
  private readonly isConnectionErrorCb: (e: Error) => boolean;
  private pingTimeout?: Timeout;
  private readonly pingCount: number = 0;
  private readonly pingIntervalMs: number;
  private pingDone: number = NO_PING_PROCESS;

  get promise(): Promise<void> {
    return this.connectionPromised.promise;
  }


  constructor(
    pingCb: () => Promise<void>,
    isConnectionErrorCb: (e: Error) => boolean,
    pingIntervalMs: number,
    pingCount: number
  ) {
    this.pingCb = pingCb;
    this.isConnectionErrorCb = isConnectionErrorCb;
    this.pingIntervalMs = pingIntervalMs;
    this.pingCount = pingCount;
  }


  async send(requestCb: () => Promise<any>): Promise<any> {
    // TODO: что если сейчас уже идет запрос???

    // if host hasn't been connected then wait for connection or connection failed
    // and make a new request
    if (!this.isConnected()) {
      try {
        await this.promise;
      }
      catch (e) {
        // do nothing
      }
    }

    try {
      return await requestCb();
    }
    catch (e) {
      if (!this.isConnectionErrorCb(e)) {
        throw e;
      }

      this.startPing();

      await this.promise;

      // TODO: если считалось что нет соединения то повторный запрос ненужен
      return await requestCb();
    }
  }

  isConnected(): boolean {
    return this.pingDone === NO_PING_PROCESS;
  }

  onConnected(cb: () => void): number {
    return this.events.addListener(EVENTS.connected, cb);
  }

  onDisconnected(cb: () => void): number {
    return this.events.addListener(EVENTS.disconnected, cb);
  }

  removeListener(handlerIndex: number) {
    this.events.removeListener(handlerIndex);
  }


  private startPing() {
    // don't start another ping process if there is some started.
    if (this.pingTimeout) return;

    this.connectionPromised.destroy();

    this.connectionPromised = new Promised<void>();
    this.pingDone = 0;
    this.pingTimeout = setTimeout(this.handlePing, this.pingIntervalMs);
  }

  private handlePing = async () => {
    if (this.pingDone >= this.pingCount) {
      this.stopPing();
      this.connectionPromised.reject(new Error(`Connection timeout`));

      return;
    }

    this.pingDone++;

    try {
      await this.pingCb();
    }
    catch (e) {
      // just make another ping
      this.pingTimeout = setTimeout(this.handlePing, this.pingIntervalMs);

      return;
    }
    // if ok then stop ping
    this.stopPing();
    this.connectionPromised.resolve();
  }

  private stopPing() {
    this.pingDone = NO_PING_PROCESS;

    clearTimeout(this.pingTimeout as any);

    delete this.pingTimeout;
  }

}
