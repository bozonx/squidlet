export interface ConnectionMessage {
  port: number;
  payload: Uint8Array;
}

export type IncomeDataHandler = (peerId: string, port: number, payload: Uint8Array) => Promise<void>;
export type PeerStatusHandler = (peerId: string) => Promise<void>;
export type ConnectionServiceType = 'connection';

// TODO: может где-то сделать enum ???
export const CONNECTION_SERVICE_TYPE = 'connection';


export default interface Connection {
  serviceType: ConnectionServiceType;

  /**
   * Send data to peer and don't wait for response.
   * Port is from 0 and up to 255.
   */
  send(peerId: string, port: number, payload: Uint8Array): Promise<void>;

  onIncomeData(cb: IncomeDataHandler): number;
  onPeerConnect(cb: PeerStatusHandler): number;
  onPeerDisconnect(cb: PeerStatusHandler): number;

  /**
   * Remove listener of onIncomeData, onPeerConnect or onPeerDisconnect
   */
  removeListener(handlerIndex: number): void;
}
