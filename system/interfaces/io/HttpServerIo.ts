export const Methods = [
  'newServer',
  'closeServer',
  'onServerClose',
  'onServerError',
  'onServerListening',
  'onRequest',
  'sendResponse',
  'removeListener',
];

export enum HttpServerEvent {
  listening,
  serverClose,
  serverError,
  request,
}

export interface HttpServerProps {
  host: string;
  port: number;
}

interface CommonHeaders {
  'content-type'?: string;
}

export interface HttpRequestHeaders extends CommonHeaders {
}

export interface HttpResponseHeaders extends CommonHeaders {
}

// TODO: поддержка Uint8Array

export interface HttpRequest {
  method: HttpMethods;
  url: string;
  headers: HttpRequestHeaders;
  body?: string | Uint8Array;
}

export interface HttpResponse {
  // method: HttpMethods;
  // url: string;
  headers: HttpResponseHeaders;
  status: number;
  //statusString: string;
  body?: string | Uint8Array;
}

export type HttpMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';
type HttpRequestHandler = (requestId: number, request: HttpRequest) => void;


export interface HttpServerIo {
  /**
   * make new server and return serverId
   */
  newServer(props: HttpServerProps): Promise<string>;

  /**
   * Shut down a server which has been previously created
   */
  closeServer(serverId: string): Promise<void>;

  /**
   * on server close. Depend on http server close
   */
  onServerClose(serverId: string, cb: () => void): Promise<number>;

  /**
   * Emits on server error
   */
  onServerError(serverId: string, cb: (err: Error) => void): Promise<number>;

  /**
   * when server starts listening
   */
  onServerListening(serverId: string, cb: () => void): Promise<number>;

  // TODO: может резуьтат возвращать в промисе
  /**
   * Handle new request.
   * Please call the sendResponse with a received `requestId` to make a response to client.
   */
  onRequest(serverId: string, cb: HttpRequestHandler): Promise<number>;

  /**
   * Send a response to client.
   * Call it only when you are handled a request.
   */
  sendResponse(requestId: number, response: HttpResponse): Promise<void>;

  /**
   * Remove one of server listeners
   */
  removeListener(serverId: string, eventName: HttpServerEvent,handlerIndex: number): Promise<void>;
}