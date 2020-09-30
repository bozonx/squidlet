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

  get promise(): Promise<void> {
    return this.connectionPromised.promise;
  }


  constructor(pingCb: () => Promise<void>) {
    this.pingCb = pingCb;
  }


  async send(requestCb: () => Promise<any>): Promise<any> {

  }

  isConnected(): boolean {
    // TODO: add
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
