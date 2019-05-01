import {WebSocketServer} from '../WebSocketServer/WebSocketServer';
import {ReceiveHandler} from '../../../system/interfaces/DuplexDriver';


// TODO: make interface of server driver to use just logic


interface RouteParams {

}


// export class RouteConnection {
//   // client's connection to this route
//   readonly connectionId: string;
//   readonly action: string;
//
//
//   constructor() {
//
//   }
//
//   destroy() {
//
//   }
//
//
//   /**
//    * Send to client of this route
//    */
//   send(data: string | Uint8Array): Promise<void> {
//     // TODO: how to send to route ????
//   }
//
//   onMessage(cb: OnMessageHandler): number {
//     // TODO: !!!!
//   }
//
//   removeMessageListener(handlerId: number) {
//     // TODO: !!!!
//   }
//
// }


export default class WsServerDuplexLogic {
  constructor(connectionId: string, serverDriver: WebSocketServer) {

  }

  send(dataAddressStr: number | string, data: Uint8Array): Promise<void> {
    // TODO: формировать сообщение - первый байт адрес, далее сообщение Uin8
  }

  request(dataAddressStr: number | string, data?: Uint8Array): Promise<Uint8Array> {

  }

  /**
   * Listen to all the received data of all the dataAddresses
   */
  onReceive(dataAddressStr: number | string, handler: ReceiveHandler): number {

  }

  removeListener(handlerIndex: number): void {

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
