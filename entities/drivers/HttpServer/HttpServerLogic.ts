import {HttpContentType, HttpRequestHandler, HttpServerIo, HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import Promised from 'system/lib/Promised';
import {
  HttpRequest,
  HttpResponseHeaders
} from 'system/interfaces/io/HttpServerIo';
import {SERVER_STARTING_TIMEOUT_SEC} from 'system/constants';
import IndexedEvents from 'system/lib/IndexedEvents';
import {HttpRequestBase, HttpResponse} from 'system/interfaces/io/HttpServerIo';
import {JsonTypes} from 'system/interfaces/Types';
import {parseBody, prepareBody, resolveBodyType} from 'system/lib/httpBody';


export interface HttpDriverRequest extends HttpRequestBase {
  body?: JsonTypes | Uint8Array;
}

export interface HttpDriverResponse {
  // if you don't set a status then 200 or 500 will be used
  status?: number;
  // headers are optional. But content-type will be set.
  headers?: HttpResponseHeaders;
  body?: JsonTypes | Uint8Array;
}

type HttpDriverHandler = (request: HttpDriverRequest) => Promise<HttpDriverResponse>;


export default class HttpServerLogic {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this._listeningPromised.promise;
  }

  private requestEvents = new IndexedEvents<HttpRequestHandler>();
  private readonly httpServerIo: HttpServerIo;
  private readonly props: HttpServerProps;
  private readonly onClose: () => void;
  private readonly logDebug: (message: string) => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private serverId: string = '';
  private _listeningPromised: Promised<void>;


  constructor(
    httpServerIo: HttpServerIo,
    props: HttpServerProps,
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logDebug: (message: string) => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.httpServerIo = httpServerIo;
    this.props = props;
    this.onClose = onClose;
    this.logDebug = logDebug;
    this.logInfo = logInfo;
    this.logError = logError;
    this._listeningPromised = new Promised<void>();
  }

  async init() {
    this.logInfo(`... Starting http server: ${this.props.host}:${this.props.port}`);

    this.serverId = await this.httpServerIo.newServer(this.props);

    await this.startListen();
  }

  async destroy() {
    if (!this.isInitialized()) {
      return this.logError(`HttpServerLogic.destroy: Server hasn't been initialized yet.`);
    }

    this.requestEvents.removeAll();
    // TODO: не должно поднять события
    await this.httpServerIo.closeServer(this.serverId);

    delete this.serverId;
  }


  isInitialized(): boolean {
    return typeof this.serverId !== 'undefined';
  }


  onRequest(cb: HttpDriverHandler): number {
    const cbWrapper = (requestId: number, request: HttpRequest) => {
      this.callRequestCb(requestId, request, cb)
        .catch(this.logError);
    };

    return this.requestEvents.addListener(cbWrapper);
  }

  removeRequestListener(handlerIndex: number) {
    this.requestEvents.removeListener(handlerIndex);
  }

  async closeServer() {
    if (!this.serverId) return;

    // TODO: должно при этом подняться событие close
    await this.httpServerIo.closeServer(this.serverId);

    delete this.serverId;
  }


  private async startListen() {
    // TODO: проверить как быдет отписываться

    if (!this.serverId) throw new Error(`No serverId`);

    const listeningTimeout = setTimeout(() => {
      this.handleTimeout()
        .catch(this.logError);
    }, SERVER_STARTING_TIMEOUT_SEC * 1000);

    await this.httpServerIo.onServerClose(this.serverId, () => {
      clearTimeout(listeningTimeout);
      this.handleCloseServer();
    });
    await this.httpServerIo.onServerError(this.serverId, (err: string) => this.logError(err));
    await this.httpServerIo.onServerListening(this.serverId, () => {
      clearTimeout(listeningTimeout);
      this.logDebug(`HttpServerLogic: server ${this.props.host}:${this.props.port} started listening`);
      this._listeningPromised.resolve();
    });
    await this.httpServerIo.onRequest(this.serverId, this.handleRequest);
  }

  private async handleTimeout() {
    this._listeningPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
    await this.httpServerIo.closeServer(this.serverId);
  }

  private async handleCloseServer() {
    this.logDebug(`HttpServerLogic: server ${this.props.host}:${this.props.port} has been closed`);
    delete this.serverId;
    this.requestEvents.removeAll();
    this.onClose();
  }

  private handleRequest = (requestId: number, request: HttpRequest) => {
    this.logDebug(`HttpServerLogic: income message on server ${this.props.host}:${this.props.port} has been closed, request ${JSON.stringify(request)}`);
    this.requestEvents.emit(requestId, request);
  }

  private async callRequestCb(requestId: number, request: HttpRequest, cb: HttpDriverHandler) {
    const preparedRequest: HttpDriverRequest = {
      ...request,
      body: parseBody(request.headers['content-type'], request.body),
    };

    let preparedResponse: HttpResponse;
    // let status = 200;
    // let statusString: 'OK';

    try {
      const response: HttpDriverResponse = await cb(preparedRequest);
      const contentType: HttpContentType = (response.headers && response.headers['content-type'])
        || resolveBodyType(response.body);

      preparedResponse = {
        ...response,
        status: 200,
        statusString: 'OK',
        headers: {
          ...response.headers,
          'content-type': contentType,
        },
        body: prepareBody(response.body),
    };
    }
    catch(err) {
      preparedResponse = {
        headers: {
          'content-type': 'text/plain',
        },
        status: 500,
        statusString: 'Server error',
        body: String(err),
      };
    }

    await this.httpServerIo.sendResponse(requestId, preparedResponse);
  }

}
