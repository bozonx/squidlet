export interface WebSocketServerProps {
  // The hostname where to bind the server
  host?: string;
  // The port where to bind the server
  port?: number;
}

export interface WSSeverDev {
  onOpen(cb: () => void): void;
  onMessage(cb: (data: any) => void): void;
  send(data: any): void;
}

export default interface WebSocketServerDev {

}