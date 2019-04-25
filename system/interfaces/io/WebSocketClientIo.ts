export interface WebSocketClientProps {
  url: string;
}


export const Methods = [
  'newConnection',
  'onOpen',
  'onClose',
  'onMessage',
  'onError',
  'send',
  'reConnect',
];


export default interface WebSocketClientIo {
  newConnection(props: WebSocketClientProps): number;
  onOpen    (connectionId: number, cb: () => void): void;
  onClose   (connectionId: number, cb: () => void): void;
  onMessage (connectionId: number, cb: (data: string | Uint8Array) => void): void;
  onError   (connectionId: number, cb: (err: string) => void): void;
  send      (connectionId: number, data: string | Uint8Array): void;
  reConnect (connectionId: number): void;
}
