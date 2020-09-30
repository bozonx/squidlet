import IndexedEventEmitter from '../lib/IndexedEventEmitter';
import Promised from '../lib/Promised';


enum EVENTS {
  connected,
  disconnected,
}


// TODO: после последнего запроса через какое-то время сделать ping

export default class PeerConnectionLogic {
  private events = new IndexedEventEmitter();
  private connectionPromised = new Promised<void>();
  private pingCb: () => Promise<void>;
  private isConnectionErrorCb: (e: Error) => boolean;
  private connected: boolean = false;

  get promise(): Promise<void> {
    return this.connectionPromised.promise;
  }


  constructor(pingCb: () => Promise<void>, isConnectionErrorCb: (e: Error) => boolean) {
    this.pingCb = pingCb;
    this.isConnectionErrorCb = isConnectionErrorCb;
  }


  async send(requestCb: () => Promise<any>): Promise<any> {
    let result: any;

    // TODO: что если сейчас уже идет запрос???
    // TODO: что если сейчас в данный момент считается что соединения нет?

    try {
      result = await requestCb();
    }
    catch (e) {
      if (!this.isConnectionErrorCb(e)) {
        throw e;
      }

      // TODO: запустить процесс пинга
    }
  }

  isConnected(): boolean {
    return this.connected;
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

}
