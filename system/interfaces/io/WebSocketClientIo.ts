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
  newConnection       (props: WebSocketClientProps): string;
  onOpen              (connectionId: string, cb: () => void): number;
  onClose             (connectionId: string, cb: () => void): number;
  onMessage           (connectionId: string, cb: (data: string | Uint8Array) => void): number;
  onError             (connectionId: string, cb: (err: string) => void): number;
  removeEventListener (connectionId: string, eventName: WsClientEvents, handlerIndex: number): void;
  send                (connectionId: string, data: string | Uint8Array): void;
  close               (connectionId: string, code: number, reason: string): void;
  reConnect           (connectionId: string, props: WebSocketClientProps): void;
  destroyConnection   (connectionId: string): void;
}
