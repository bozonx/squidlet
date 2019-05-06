import {WsEvents} from './WebSocketClientIo';


export const Methods = [
  'newServer',
  'closeServer',
  'onConnection',
  'onServerListening',
  'onServerClose',
  'onServerError',
  'onClose',
  'onMessage',
  'onError',
  'removeEventListener',
  'removeServerEventListener',
  'send',
  'close',
];

export const wsServerEventNames = {
  listening: 'listening',
  close: 'close',
  connection: 'connection',
  error: 'error',
};


export type WsServerEvents = 'listen' | 'close' | 'connection' | 'error';

export interface WebSocketServerProps {
  // The hostname where to bind the server
  host: string;
  // The port where to bind the server
  port: number;
}

export interface ConnectionParams {
  url: string;
  method: string;
  statusCode: number;
  statusMessage: string;
  headers: {
    authorization?: string;
    cookie?: string;
    'user-agent'?: string;
  };
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
  onConnection(serverId: string, cb: (connectionId: string, connectionParams: ConnectionParams) => void): number;

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

  onClose(serverId: string, connectionId: string, cb: () => void): number;
  onMessage(serverId: string, connectionId: string, cb: (data: string | Uint8Array) => void): number;
  onError(serverId: string, connectionId: string, cb: (err: Error) => void): number;
  removeEventListener(serverId: string, connectionId: string, eventName: WsEvents, handlerIndex: number): void;
  send(serverId: string, connectionId: string, data: string | Uint8Array): Promise<void>;
  close(serverId: string, connectionId: string, code: number, reason: string): void;
}
