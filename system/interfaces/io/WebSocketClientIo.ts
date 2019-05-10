import {ConnectionParams} from './WebSocketServerIo';

export const Methods = [
  'newConnection',
  'reConnect',
  'onOpen',
  'onClose',
  'onMessage',
  'onError',
  'onUnexpectedResponse',
  'removeEventListener',
  'send',
  'close',
];

export const wsEventNames: {[index: string]: WsEvents} = {
  open: 'open',
  close: 'close',
  message: 'message',
  error: 'error',
  unexpectedResponse: 'unexpectedResponse',
};

export type WsEvents = 'open' | 'close' | 'message' | 'error' | 'unexpectedResponse';
export type OnMessageHandler = (data: string | Uint8Array) => void;

export interface WebSocketClientProps {
  url: string;
}

export default interface WebSocketClientIo {
  newConnection       (props: WebSocketClientProps): string;
  reConnect           (connectionId: string, props: WebSocketClientProps): void;

  onOpen              (connectionId: string, cb: () => void): number;
  onClose             (connectionId: string, cb: () => void): number;
  onMessage           (connectionId: string, cb: (data: string | Uint8Array) => void): number;
  onError             (connectionId: string, cb: (err: Error) => void): number;
  onUnexpectedResponse(connectionId: string, cb: (response: ConnectionParams) => void): number;
  removeEventListener (connectionId: string, eventName: WsEvents, handlerIndex: number): void;
  send                (connectionId: string, data: string | Uint8Array): Promise<void>;
  close               (connectionId: string, code: number, reason?: string): void;
}
