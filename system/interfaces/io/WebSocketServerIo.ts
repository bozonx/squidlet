export interface WebSocketServerProps {
  // The hostname where to bind the server
  host: string;
  // The port where to bind the server
  port: number;
}

export interface ConnectionParams {
  url: string;
}


export const Methods = [
  'onMessage',
  'send',
];


export default interface WebSocketServerIo {
  // make new server and return serverId
  newServer(props: WebSocketServerProps): string;
  // when new client is connected
  onConnection(serverId: string, cb: (clientId: string, connectionParams: ConnectionParams) => void): void;
  // when server starts listening
  onListening(serverId: string, cb: () => void): void;
  // on server close. Depend on http server close
  onClose(serverId: string, cb: () => void): void;
  onServerError(serverId: string, cb: (err: Error) => void): void;

  //onOpen(cb: () => void): void;
  //onMessage(cb: (data: any) => void): void;
  //send(data: any): void;
}
