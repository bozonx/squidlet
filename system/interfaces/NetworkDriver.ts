enum NetworkStatus {
  ok = 200,
  badRequest = 400,
  serverError = 500,
}

export interface NetworkRequest {
  requestId: number;
  body: Uint8Array | string;
}

export interface NetworkResponse {
  requestId: number;
  status: NetworkStatus;
  body: Uint8Array | string;
}

export interface NetworkDriverProps {
  busId: number | string;
  // wait seconds for data transfer ends
  requestTimeoutSec: number;
}

export type IncomeRequestHandler = (request: NetworkRequest) => Promise<NetworkResponse>;
export type IncomeResponseHandler = (request: NetworkResponse) => void;


export default interface NetworkDriver {
  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   */
  request(register: number, body: Uint8Array): Promise<NetworkRequest>;

  /**
   * Handle income request at specified register.
   * You have to generate a response
   */
  onRequest(register: number, handler: IncomeRequestHandler): number;

  // /**
  //  * Handle income response from remote node
  //  */
  // onResponse(register: number, handler: IncomeResponseHandler): number;

  // TODO: может выделить отправку ответа в отдельный метод????

  /**
   * Remove listener that has been set by `onRequest` or `onResponse`
   */
  removeListener(handlerIndex: number): void;
}
