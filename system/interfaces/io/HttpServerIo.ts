export const Methods = [
  'newServer',
  'closeServer',
  'onServerClose',
  'onServerError',
  'onServerListening',
  'onRequest',
];

export enum HttpServerEvent {
  listening,
  serverClose,
  serverError,
  request,
}

interface HttpServerProps {
  host: string;
  port: number;
}

interface HttpRequestHeaders {
  contentType?: string;
}

interface HttpResponseHeaders {
  contentType?: string;
}

// TODO: поддержка Uint8Array

export interface HttpRequest {
  method: HttpMethods;
  url: string;
  headers: HttpRequestHeaders;
  body?: string | Uint8Array;
}

export interface HttpResponse {
  method: HttpMethods;
  url: string;
  headers: HttpResponseHeaders;
  status: number;
  statusString: string;
  body?: string | Uint8Array;
}

type HttpMethods = 'get' | 'post' | 'put' | 'patch' | 'delete';
// TODO: сформировать ответ
type HttpRequestHandler = (request: HttpRequest) => void;


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

  /**
   * Handle new request
   */
  onRequest(serverId: string, cb: HttpRequestHandler): Promise<number>;

  /**
   * Remove one of server listeners
   */
  removeListener(serverId: string, eventName: HttpServerEvent,handlerIndex: number): Promise<void>;
}
