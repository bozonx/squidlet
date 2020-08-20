export enum ConnectionStatus {
  ok = 0,
  // body contains an error string
  errorMessage,
}

export interface ConnectionRequest {
  channel: number;
  // should be 16 bits
  requestId: number;
  data: Uint8Array;
}

export interface ConnectionSendResponse {
  status: ConnectionStatus;
  body?: Uint8Array;
  error?: string;
}

export interface ConnectionResponse extends ConnectionSendResponse {
  requestId: number;
}

// export interface ConnectionDriverProps {
//   busId: number | string;
//   // wait seconds for data transfer ends
//   //requestTimeoutSec: number;
// }

export type ConnectionIncomeRequestHandler = (request: ConnectionRequest) => Promise<ConnectionResponse>;
export type ConnectionIncomeResponseHandler = (request: ConnectionResponse) => void;


export default interface Connection {
  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address
   * on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   * Register is 8 bits.
   * Port is from 0 to 255 but don't use port 255 it is registered for network data transfer.
   */
  request(sessionId: string, channel: number, data: Uint8Array): Promise<ConnectionSendResponse>;

  /**
   * Handle income request at specified register.
   * You have to generate a response
   */
  onRequest(channel: number, handler: ConnectionIncomeRequestHandler): number;

  /**
   * Remove listener that has been set by `onRequest` or `onResponse`
   */
  removeListener(handlerIndex: number): void;
}
