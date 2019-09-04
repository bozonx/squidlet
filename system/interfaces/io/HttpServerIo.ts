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
  request,
  listening,
  serverClose,
  serverError,
}


export type HttpContentType = 'text/plain'
  | 'text/html'
  | 'application/json'
  | 'application/javascript'
  | 'application/xml';
export type HttpMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type HttpRequestHandler = (requestId: number, request: HttpRequest) => void;

interface CommonHeaders {
  'content-type'?: HttpContentType;
}

export interface HttpServerProps {
  host: string;
  port: number;
}

export interface HttpRequestHeaders extends CommonHeaders {
}

export interface HttpResponseHeaders extends CommonHeaders {
}

// TODO: поддержка Uint8Array

export interface HttpRequestBase {
  method: HttpMethods;
  url: string;
  headers: HttpRequestHeaders;
}

export interface HttpRequest extends HttpRequestBase {
  body?: string | Uint8Array;
}

export interface HttpResponse {
  headers: HttpResponseHeaders;
  status: number;
  body?: string | Uint8Array;
}


export interface HttpServerIo {
  /**
   * Destroy server and don't rise a close event.
   */
  destroy: () => Promise<void>;

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
  onServerError(serverId: string, cb: (err: string) => void): Promise<number>;

  /**
   * when server starts listening
   */
  onServerListening(serverId: string, cb: () => void): Promise<number>;

  /**
   * Handle new request.
   * Please call the sendResponse with a received `requestId` to make a response to client.
   */
  onRequest(serverId: string, cb: HttpRequestHandler): Promise<number>;

  /**
   * Send a response to client.
   * Call it only when you are handled a request.
   */
  sendResponse(serverId: string, requestId: number, response: HttpResponse): Promise<void>;

  /**
   * Remove one of server listeners
   */
  removeListener(serverId: string, eventName: HttpServerEvent, handlerIndex: number): Promise<void>;
}
