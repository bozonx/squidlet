export interface WebSocketServerProps {
  port?: number;
}

export interface WSSeverDev {
  onOpen(cb: () => void): void;
  onMessage(cb: (data: any) => void): void;
  send(data: any): void;
}

export default interface WebSocketServerDev {

}
