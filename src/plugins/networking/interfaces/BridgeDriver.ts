export type IncomeMessageHandler = (channel: number, payload: Uint8Array) => void;

export enum BridgeConnectionState {
  connected,
  // tries to connect or wait for the next try
  connecting,
  // finally closed connection
  closed,
}

// export enum ConnectionsEvents {
//   message,
//   connected,
// }

// export interface NetworkDriverProps {
//   busId: number | string;
//   // wait seconds for data transfer ends
//   //requestTimeoutSec: number;
// }


export interface BridgeDriver {
  getConnectionState(): BridgeConnectionState

  /**
   * Send data to peer and don't wait for response.
   * Channel is from 0 and up to 255
   */
  sendMessage(channel: number, body: Uint8Array): Promise<void>

  onIncomeMessage(cb: IncomeMessageHandler): number
  onConnectionState(cb: (state: BridgeConnectionState) => void): number

  removeListener(handlerIndex: number): void
}
