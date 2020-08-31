/*
 * request
 * * port
 * * requestId
 * * status 255 = request
 * * any data
 *
 * response
 * * port
 * * requestId
 * * status 0 == OK, >0<255 = response error code
 * * any data | no data
 */

// TODO: review
export enum ConnectionStatus {
  responseOk = 253,
  // TODO: может ошибку обрабатывать не на этом уровне а выше?
  // payload contains an error string
  responseError = 254,
}

export interface ConnectionMessage {
  port: number;
  // should be 16 bits
  requestId: number;
}

export interface ConnectionRequest extends ConnectionMessage {
  payload: Uint8Array;
}

export interface ConnectionResponse extends ConnectionMessage {
  status: ConnectionStatus;
  // it will be undefined on error
  payload?: Uint8Array;
  error?: string;
}

export type ConnectionOnRequestHandler = (
  request: ConnectionRequest,
  peerId: string
) => Promise<Uint8Array>;
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
  request(peerId: string, port: number, payload: Uint8Array): Promise<ConnectionResponse>;

  /**
   * Handle income requests at specified port.
   * Only one handler of specified port is allowed.
   * You have to generate a response in your handler.
   * Reserved channels:
   * * 252 - network service messages
   * * 253 - response status OK
   * * 254 - response status Error
   * * 255 - broadcast message
   */
  startListenPort(port: number, handler: ConnectionOnRequestHandler): void;

  /**
   * Remove listener of onRequest
   */
  stopListenPort(port: number): void;

  onPeerConnect(cb: (peerId: string) => void): number;
  onPeerDisconnect(cb: (peerId: string) => void): number;

  /**
   * Remove listener of onPeerConnect or onPeerDisconnect
   */
  removeListener(handlerIndex: number): void;
}
