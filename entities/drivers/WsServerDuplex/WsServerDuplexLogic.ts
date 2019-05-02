import DuplexDriver, {ReceiveHandler} from '../../../system/interfaces/DuplexDriver';
import {addFirstItemUint8Arr, isUint8Array, withoutFirstItemUint8Arr} from '../../../system/helpers/collections';
import {OnMessageHandler} from '../../../system/interfaces/io/WebSocketClientIo';


// TODO: make interface of server driver to use just logic
interface WsServerLogic {
  send(connectionId: string, data: string | Uint8Array): Promise<void>;
  onMessage(connectionId: string, cb: OnMessageHandler): number;
  removeMessageListener(connectionId: string, handlerId: number): void;
}


export default class WsServerDuplexLogic implements DuplexDriver {
  private readonly connectionId: string;
  private readonly server: WsServerLogic;
  private readonly logError: (message: string) => void;

  constructor(connectionId: string, serverDriver: WsServerLogic, logError: (message: string) => void) {
    this.connectionId = connectionId;
    this.server = serverDriver;
    this.logError = logError;
  }

  send(action: number, data: Uint8Array): Promise<void> {
    const message: Uint8Array = addFirstItemUint8Arr(data, action);

    return this.server.send(this.connectionId, message);
  }

  async request(action: number, data: Uint8Array): Promise<Uint8Array> {
    // TODO: send and listen to receive
    // TODO: add timeout

    return new Uint8Array(0);
  }

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(action: number, handler: ReceiveHandler): number {
    return this.server.onMessage(this.connectionId, (message: string | Uint8Array) => {
      if (!isUint8Array(message)) {
        return this.logError(`WsServerDuplexLogic: Can only receive an Uint8Array`);
      }
      if (!message.length) {
        return this.logError(`WsServerDuplexLogic: Received data is empty`);
      }

      const receivedAction: number = (message as Uint8Array)[0];

      // check if it ours action
      if (action !== receivedAction) return;

      const receivedData: Uint8Array = withoutFirstItemUint8Arr(message as Uint8Array);

      handler(receivedAction, receivedData);
    });
  }

  removeListener(handlerIndex: number): void {
    this.server.removeMessageListener(this.connectionId, handlerIndex);
  }


  // onConnection(cb: (routeParams: RouteParams) => void): number {
  //
  // }
  //
  // removeConnectionListener(handlerId: number) {
  //
  // }
  //
  // /**
  //  * Force closing a connection to all the routes
  //  */
  // closeConnection(connectionId: string, code: number, reason: string) {
  //
  // }

}
