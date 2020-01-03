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

export type IncomeRequestHandler = (register: number, request: NetworkRequest) => Promise<NetworkResponse>;


export default interface NetworkDriver {
  /**
   * Send data and waiting of response.
   * On the other side you should listen to this address and send data to the same address on this side.
   * An error will be risen only if request hasn't been sent or on response timeout.
   */
  request(register: number, data?: Uint8Array): Promise<NetworkRequest>;

  /**
   * Handle income request at specified register.
   * You have to generate a response
   */
  onIncome(register: number, handler: IncomeRequestHandler): number;

  // TODO: может выделить отправку ответа в отдельный метод????

  removeListener(handlerIndex: number): void;
}
