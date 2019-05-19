import {WsEvents} from './WebSocketClientIo';
import IoItem from '../IoItem';


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


export default interface WebSocketServerIo extends IoItem {
  /**
   * make new server and return serverId
   */
  newServer(props: WebSocketServerProps): Promise<string>;

  /**
   * Shut down a server which has been previously created
   */
  closeServer(serverId: string): Promise<void>;

  /**
   * when new client is connected
   */
  onConnection(
    serverId: string,
    cb: (connectionId: string, request: ConnectionParams) => Promise<void>
  ): number;

  // /**
  //  * Listen header at handshake to modify them
  //  */
  // onHeaders(serverId: string, cb: (headers: {[index: string]: string}, request: ConnectionParams) => void): number;

  /**
   * when server starts listening
   */
  onServerListening(serverId: string, cb: () => void): Promise<number>;

  /**
   * on server close. Depend on http server close
   */
  onServerClose(serverId: string, cb: () => void): Promise<number>;

  /**
   * Emits on server error
   */
  onServerError(serverId: string, cb: (err: Error) => void): Promise<number>;

  /**
   * Remove one of server listeners
   */
  removeServerEventListener(serverId: string, eventName: WsServerEvents, handlerIndex: number): Promise<void>;

  ////////// Connection's methods like in client, but without onOpen

  /**
   * On connection close
   */
  onClose(serverId: string, connectionId: string, cb: () => void): Promise<number>;
  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): Promise<number>;
  onError(serverId: string, connectionId: string, cb: (err: Error) => void): Promise<number>;
  onUnexpectedResponse(serverId: string, connectionId: string, cb: (response: ConnectionParams) => void): Promise<number>
  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): Promise<void>;
  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void>;
  close(serverId: string, connectionId: string, code: number, reason: string): Promise<void>;
}
