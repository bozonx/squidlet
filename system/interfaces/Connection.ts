export enum ConnectionStatus {
  request,
  responseOk,
  // payload contains an error string
  responseError,
}

export interface ConnectionMessage {
  // TODO: rename to port
  channel: number;
  // should be 16 bits
  requestId: number;
  status: ConnectionStatus;
}

export interface ConnectionRequest extends ConnectionMessage {
  //request: true;
  // TODO: rename to payload
  payload: Uint8Array;
}

export interface ConnectionResponse extends ConnectionMessage {
  // means response
  //request: false;
  // it will be undefined on error
  payload?: Uint8Array;
  error?: string;
}

// export interface ConnectionDriverProps {
//   busId: number | string;
//   // wait seconds for data transfer ends
//   //requestTimeoutSec: number;
// }

export type ConnectionOnRequestHandler = (
  request: ConnectionRequest,
  connectionId: string
) => Promise<ConnectionResponse>;

export type ConnectionServiceType = 'connection';
export const CONNECTION_SERVICE_TYPE = 'connection';

//export type ConnectionIncomeResponseHandler = (response: ConnectionResponse) => void;


export default interface Connection {
  serviceType: ConnectionServiceType;

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address
   * on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   * Register is 8 bits.
   * Port is from 0 to 255 but don't use port 255 it is registered for network data transfer.
   */
  request(sessionId: string, channel: number, data: Uint8Array): Promise<ConnectionResponse>;

  // TODO: может тоже на 1 port 1 обработчик ???
  /**
   * Handle income request at specified channel.
   * You have to generate a response
   */
  onRequest(handler: ConnectionOnRequestHandler): number;

  onNewConnection(cb: (connectionId: string) => void): void;
  onEndConnection(cb: (connectionId: string) => void): void;

  /**
   * Remove listener
   */
  removeListener(handlerIndex: number): void;
}
