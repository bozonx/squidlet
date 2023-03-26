export type IncomeMessageHandler = (channel: number, payload: Uint8Array) => void;

export enum BridgeConnectionState {
  // initial state, before starting of connection
  initial,
  connected,
  // tries to connect or wait for the next try
  connecting,
  // finally closed connection
  closed,
}

export enum BRIDGE_EVENT {
  incomeMessage,
  connectionStateChanged,
}

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

  on(
    eventName: BRIDGE_EVENT.incomeMessage,
    cb: IncomeMessageHandler
  ): number
  on(
    eventName: BRIDGE_EVENT.connectionStateChanged,
    cb: (state: BridgeConnectionState) => void
  ): number
  off(handlerIndex: number): void

}
