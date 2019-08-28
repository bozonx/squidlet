export const Methods = [
  'newServer',
  'closeServer',
  'onServerClose',
  'onServerError',
  'onServerListening',
  'onRequest',
];

export enum HttpEvent {
  listening,
  serverClose,
  serverError,
  request,
}

interface HttpServerProps {
  host: string;
  port: number;
}

interface HttpHeaders {
  contentType?: string;
}

export interface HttpRequest {
  method: HttpMethods;
  url: string;
  headers: HttpHeaders;
  status: number;
  statusString: string;
  body?: string;
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
  removeListener(serverId: string, eventName: HttpEvent,handlerIndex: number): Promise<void>;
}
