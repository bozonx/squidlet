export interface WebSocketClientProps {
  url: string;
}


export const WSClientMethods = [
  'onClose',
  'onMessage',
  'onError',
  'send',
];


export interface WSClientDev {
  onClose(cb: () => void): void;
  //onConnection(cb: () => void): void;
  //onListening(cb: () => void): void;
  onMessage(cb: (data: any) => void): void;
  onError(cb: (err: Error) => void): void;
  send(data: any): void;
}

export default interface WebSocketClientDev {

}
