import {WsClientEvents} from './WebSocketClientIo';


export const Methods = [
  'onMessage',
  'send',
];


export interface WebSocketServerProps {
  // The hostname where to bind the server
  host: string;
  // The port where to bind the server
  port: number;
}

export interface ConnectionParams {
  url: string;
}


export default interface WebSocketServerIo {
  // make new server and return serverId
  newServer(props: WebSocketServerProps): string;
  // when new client is connected
  onConnection(serverId: string, cb: (clientId: string, connectionParams: ConnectionParams) => void): void;
  // when server starts listening
  onServerListening(serverId: string, cb: () => void): void;
  // on server close. Depend on http server close
  onServerClose(serverId: string, cb: () => void): void;
  onServerError(serverId: string, cb: (err: Error) => void): void;

  // connection's methods like in client
  //onOpen              (serverId: string, connectionId: string, cb: () => void): number;
  onClose             (serverId: string, connectionId: string, cb: () => void): number;
  onMessage           (serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number;
  onError             (serverId: string, connectionId: string, cb: (err: Error) => void): number;
  // TODO: remove server listener
  // TODO: какие события ???
  removeEventListener (serverId: string, connectionId: string, eventName: WsClientEvents, handlerIndex: number): void;
  send                (serverId: string, connectionId: string, data: string | Uint8Array): void;
  close               (serverId: string, connectionId: string, code: number, reason: string): void;
}
