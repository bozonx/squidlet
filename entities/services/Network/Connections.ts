import NetworkDriver from 'system/interfaces/NetworkDriver';
import NetworkMessage from './interfaces/NetworkMessage';


/**
 * Connection manager
 */
export default class Connections {
  // driver instances by index of props.interfaces
  private drivers: NetworkDriver[] = [];


  async init() {
    // TODO: make drivers instance
  }

  destroy() {
    // TODO: add
  }


  send(busId: number | string, port: number, message: NetworkMessage) {

  }

  listenData(busId: number | string, port: number, cb: (message: NetworkMessage) => void): number {

  }

  removeListener(handlerIndex: number) {

  }

}
