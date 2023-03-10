export interface ConnectionMessage {
  port: number;
  payload: Uint8Array;
}

export type IncomeMessageHandler = (peerId: string, port: number, payload: Uint8Array) => void;
export type PeerStatusHandler = (peerId: string) => void;
export type ConnectionServiceType = 'connection';

export enum ConnectionsEvents {
  message,
  connected,
  disconnected
}

// TODO: может где-то сделать enum ???
export const CONNECTION_SERVICE_TYPE = 'connection';


export default interface Connection {
  serviceType?: ConnectionServiceType;

  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 253. Don't use 254 and 255.
   */
  send(peerId: string, port: number, payload: Uint8Array): Promise<void>;

  onIncomeMessage(cb: IncomeMessageHandler): number;
  onPeerConnect(cb: PeerStatusHandler): number;
  onPeerDisconnect(cb: PeerStatusHandler): number;

  /**
   * Remove listener of onIncomeData, onPeerConnect or onPeerDisconnect
   */
  removeListener(handlerIndex: number): void;
}
