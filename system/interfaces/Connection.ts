export enum ConnectionStatus {
  request,
  responseOk,
  // body contains an error string
  responseError,
}

export interface ConnectionMessage {
  channel: number;
  // should be 16 bits
  requestId: number;
  status: ConnectionStatus;
}

export interface ConnectionRequest extends ConnectionMessage {
  //request: true;
  body: Uint8Array;
}

export interface ConnectionResponse extends ConnectionMessage {
  // means response
  //request: false;
  // it will be undefined on error
  body?: Uint8Array;
  error?: string;
}

// export interface ConnectionDriverProps {
//   busId: number | string;
//   // wait seconds for data transfer ends
//   //requestTimeoutSec: number;
// }

export type ConnectionOnRequestHandler = (
  request: ConnectionRequest,
  sessionId: string
) => Promise<ConnectionResponse>;
//export type ConnectionIncomeResponseHandler = (response: ConnectionResponse) => void;


export default interface Connection {
  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address
   * on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   * Register is 8 bits.
   * Port is from 0 to 255 but don't use port 255 it is registered for network data transfer.
   */
  request(sessionId: string, channel: number, data: Uint8Array): Promise<ConnectionResponse>;

  /**
   * Handle income request at specified channel.
   * You have to generate a response
   */
  onRequest(handler: ConnectionOnRequestHandler): number;

  /**
   * Remove listener that has been set by `onRequest` or `onResponse`
   */
  removeListener(handlerIndex: number): void;
}
