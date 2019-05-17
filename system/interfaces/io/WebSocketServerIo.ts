import {WsEvents} from './WebSocketClientIo';


export const Methods = [
  'newServer',
  'closeServer',
  'onConnection',
  'onServerListening',
  'onServerClose',
  'onServerError',
  'removeServerEventListener',
  'onClose',
  'onMessage',
  'onError',
  'onUnexpectedResponse',
  'removeEventListener',
  'send',
  'close',
];

export const wsServerEventNames: {[index: string]: WsServerEvents} = {
  listening: 'listening',
  close: 'close',
  connection: 'connection',
  error: 'error',
  headers: 'headers',
};


export type WsServerEvents = 'listening' | 'close' | 'connection' | 'error' | 'headers';

export interface WebSocketServerProps {
  // The hostname where to bind the server
  host: string;
  // The port where to bind the server
  port: number;
}

interface CommonHeaders {
  authorization?: string;
  cookie?: string;
  'Set-Cookie'?: string;
  'user-agent'?: string;
}

export interface ConnectionParams {
  url: string;
  method: string;
  statusCode: number;
  statusMessage: string;
  headers: CommonHeaders;
}


export default interface WebSocketServerIo {
  /**
   * make new server and return serverId
   */
  newServer(props: WebSocketServerProps): string;

  /**
   * Shut down a server which has been previously created
   */
  closeServer(serverId: string): Promise<void>;

  /**
   * when new client is connected
   */
  onConnection(
    serverId: string,
    cb: (connectionId: string, request: ConnectionParams) => void
  ): number;

  // /**
  //  * Listen header at handshake to modify them
  //  */
  // onHeaders(serverId: string, cb: (headers: {[index: string]: string}, request: ConnectionParams) => void): number;

  /**
   * when server starts listening
   */
  onServerListening(serverId: string, cb: () => void): number;

  /**
   * on server close. Depend on http server close
   */
  onServerClose(serverId: string, cb: () => void): number;

  /**
   * Emits on server error
   */
  onServerError(serverId: string, cb: (err: Error) => void): number;

  /**
   * Remove one of server listeners
   */
  removeServerEventListener(serverId: string, eventName: WsServerEvents, handlerIndex: number): void;

  ////////// Connection's methods like in client, but without onOpen

  /**
   * On connection close
   */
  onClose(serverId: string, connectionId: string, cb: () => void): number;
  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number;
  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number;
  onUnexpectedResponse(serverId: string, connectionId: string, cb: (response: ConnectionParams) => void): number
  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void;
  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void>;
  close(serverId: string, connectionId: string, code: number, reason: string): void;
}
