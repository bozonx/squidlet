export const Methods = [
  'newConnection',
  'onOpen',
  'onClose',
  'onMessage',
  'onError',
  'send',
  'reConnect',
];


export type WsClientEvents = 'open' | 'close' | 'message' | 'error';

export interface WebSocketClientProps {
  url: string;
}


export default interface WebSocketClientIo {
  newConnection       (props: WebSocketClientProps): number;
  onOpen              (connectionId: number, cb: () => void): number;
  onClose             (connectionId: number, cb: () => void): number;
  onMessage           (connectionId: number, cb: (data: string | Uint8Array) => void): number;
  onError             (connectionId: number, cb: (err: string) => void): number;
  removeEventListener (connectionId: number, eventName: WsClientEvents, handlerIndex: number): void;
  send                (connectionId: number, data: string | Uint8Array): void;
  close               (connectionId: number, code: number, reason: string): void;
  reConnect           (connectionId: number, props: WebSocketClientProps): void;
}
