export enum ChannelStatus {
  ok = 0,
  // body contains an error string
  errorMessage,
}

export interface ChannelRequest {
  channel: number;
  // should be 16 bits
  requestId: number;
  data: Uint8Array;
}

export interface ChannelSendResponse {
  status: ChannelStatus;
  body?: Uint8Array;
  error?: string;
}

export interface ChannelResponse extends ChannelSendResponse {
  requestId: number;
}

// export interface ChannelDriverProps {
//   busId: number | string;
//   // wait seconds for data transfer ends
//   //requestTimeoutSec: number;
// }

export type ChannelIncomeRequestHandler = (request: ChannelRequest) => Promise<ChannelResponse>;
export type ChannelIncomeResponseHandler = (request: ChannelResponse) => void;


export default interface ChannelDriver {
  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address
   * on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   * Register is 8 bits.
   * Port is from 0 to 255 but don't use port 255 it is registered for network data transfer.
   */
  request(sessionId: string, channel: number, data: Uint8Array): Promise<ChannelSendResponse>;

  /**
   * Handle income request at specified register.
   * You have to generate a response
   */
  onRequest(channel: number, handler: ChannelIncomeRequestHandler): number;

  /**
   * Remove listener that has been set by `onRequest` or `onResponse`
   */
  removeListener(handlerIndex: number): void;
}
