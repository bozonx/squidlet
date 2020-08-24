// TODO: use status as channels
export enum ConnectionStatus {
  request,
  responseOk,
  // payload contains an error string
  responseError,
}

export interface ConnectionMessage {
  port: number;
  // should be 16 bits
  requestId: number;
  status: ConnectionStatus;
}

export interface ConnectionRequest extends ConnectionMessage {
  payload: Uint8Array;
}

export interface ConnectionResponse extends ConnectionMessage {
  // it will be undefined on error
  payload?: Uint8Array;
  error?: string;
}

export type ConnectionOnRequestHandler = (
  request: ConnectionRequest,
  connectionId: string
) => Promise<ConnectionResponse>;
export type ConnectionServiceType = 'connection';

// TODO: может где-то сделать enum ???
export const CONNECTION_SERVICE_TYPE = 'connection';


export default interface Connection {
  serviceType: ConnectionServiceType;

  /**
   * Send data and waiting of response.
   * On the other side you should listen to this port and send request.
   * An error will be risen only if request hasn't been sent or on response timeout.
   * Port is from 0 to 255 but don't use port 254 and 255.
   */
  request(connectionId: string, port: number, payload: Uint8Array): Promise<ConnectionResponse>;

  /**
   * Handle income request at specified port.
   * You have to generate a response.
   * Only one handler of one port is allowed
   */
  onRequest(port: number, handler: ConnectionOnRequestHandler): void;

  onNewConnection(cb: (connectionId: string) => void): number;
  onEndConnection(cb: (connectionId: string) => void): number;

  /**
   * Remove listener of onRequest
   */
  removeRequestListener(port: number): void;

  /**
   * Remove listener of onNewConnection or onEndConnection
   */
  removeConnectionListener(handlerIndex: number): void;
}
