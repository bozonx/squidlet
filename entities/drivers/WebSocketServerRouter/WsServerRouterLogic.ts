import {WebSocketServer} from '../WebSocketServer/WebSocketServer';


// TODO: make interface of server driver to use just logic


interface RouteParams {

}


export class RouteConnection {
  // client's connection to this route
  readonly connectionId: string;
  readonly action: string;


  constructor() {

  }

  destroy() {

  }


  /**
   * Send to client of this route
   */
  send(data: string | Uint8Array): Promise<void> {
    // TODO: how to send to route ????
  }

  onMessage(cb: OnMessageHandler): number {
    // TODO: !!!!
  }

  removeMessageListener(handlerId: number) {
    // TODO: !!!!
  }

}


export default class WsServerRouterLogic {
  constructor(serverDriver: WebSocketServer) {

  }


  onConnection(cb: (routeParams: RouteParams) => void): number {

  }

  removeConnectionListener(handlerId: number) {

  }

  /**
   * Force closing a connection to all the routes
   */
  closeConnection(connectionId: string, code: number, reason: string) {

  }

}
