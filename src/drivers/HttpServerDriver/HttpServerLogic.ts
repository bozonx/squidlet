import {
  omitUndefined,
  Promised,
  IndexedEvents,
  parseBody,
  prepareBody,
  resolveBodyType
} from 'squidlet-lib'
import {
  HttpRequestHandler,
  HttpServerEvent,
  HttpServerIoType,
  HttpServerProps,
} from '../../types/io/HttpServerIoType.js'
import {IoBase} from '../../system/Io/IoBase.js'
import {
  HttpRequest,
  HttpResponse,
  HttpContentType,
  HttpRequestBase,
  HttpResponseHeaders
} from '../../types/Http.js'
import {SERVER_STARTING_TIMEOUT_SEC} from '../../types/contstants.js'


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
  private readonly httpServerIo: HttpServerIoType & IoBase
  private readonly props: HttpServerProps;
  private readonly onClose: () => void;
  private readonly logDebug: (message: string) => void;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;

  // TODO: why not undefined?
  private serverId: string = '';
  private _listeningPromised: Promised<void>;


  constructor(
    httpServerIo: HttpServerIoType & IoBase,
    props: HttpServerProps,
    // It rises a handler only if server is closed.
    // It's better to destroy this instance and make new one if need.
    onClose: () => void,
    logDebug: (message: string) => void,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.httpServerIo = httpServerIo
    this.props = props
    this.onClose = onClose
    this.logDebug = logDebug
    this.logInfo = logInfo
    this.logError = logError
    this._listeningPromised = new Promised<void>()
  }

  async init() {
    this.logInfo(`... Starting http server: ${this.props.host}:${this.props.port}`)

    this.serverId = await this.httpServerIo.newServer(this.props)

    await this.startListen()
  }

  async destroy() {
    if (!this.isInitialized()) {
      return this.logError(`HttpServerLogic.destroy: Server hasn't been initialized yet.`)
    }

    this.requestEvents.destroy()
    // TODO: не должно поднять события
    await this.httpServerIo.closeServer(this.serverId)

    this.serverId = ''
  }


  isInitialized(): boolean {
    return typeof this.serverId !== 'undefined'
  }


  onRequest(cb: HttpDriverHandler): number {
    const cbWrapper = (requestId: number, request: HttpRequest) => {
      this.callRequestCb(requestId, request, cb)
        .catch(this.logError)
    };

    return this.requestEvents.addListener(cbWrapper)
  }

  removeRequestListener(handlerIndex: number) {
    this.requestEvents.removeListener(handlerIndex)
  }

  async closeServer(force?: boolean) {
    if (!this.serverId) return

    // TODO: должно при этом подняться событие close
    await this.httpServerIo.closeServer(this.serverId)

    this.serverId = ''
  }

  handleServerListening = () => {
    this.logDebug(`HttpServerLogic: server ${this.props.host}:${this.props.port} started listening`);
    this._listeningPromised.resolve();
  }

  handleServerClose = () => {
    // TODO: review
    this.logDebug(`HttpServerLogic: server ${this.props.host}:${this.props.port} has been closed`);

    this.serverId = ''
    // TODO: maybe better use destroy???
    this.requestEvents.removeAll()
    this.onClose()
  }

  handleServerError = (err: string) => {
    this.logError(err)
  }

  handleServerRequest = (requestId: number, request: HttpRequest) => {
    this.logDebug(`HttpServerLogic: income message of server ${this.props.host}:${this.props.port}, request ${JSON.stringify(request)}`)
    this.requestEvents.emit(requestId, request)
  }


  private async startListen() {
    // TODO: проверить как быдет отписываться

    if (!this.serverId) throw new Error(`No serverId`);

    // TODO: review
    // const listeningTimeout = setTimeout(() => {
    //   this.handleTimeout()
    //     .catch(this.logError);
    // }, SERVER_STARTING_TIMEOUT_SEC * 1000)

  }

  private async handleTimeout() {
    this._listeningPromised.reject(new Error(`Server hasn't been started. Timeout has been exceeded`));
    await this.httpServerIo.closeServer(this.serverId);
  }

  private async callRequestCb(requestId: number, request: HttpRequest, cb: HttpDriverHandler) {
    // prepare simplified request object to manipulate it in the upper code
    const preparedRequest: HttpDriverRequest = {
      ...request,
      body: parseBody(request.headers['content-type'], request.body),
    }

    let preparedResponse: HttpResponse

    try {
      const response: HttpDriverResponse = await cb(preparedRequest)

      preparedResponse = this.makeSuccessResponse(response)
    }
    catch(err) {
      preparedResponse = this.startServerErrorResponse(String(err))
    }

    await this.httpServerIo.sendResponse(requestId, preparedResponse)
  }

  private makeSuccessResponse(response: HttpDriverResponse): HttpResponse {
    const contentType: HttpContentType | undefined = (response.headers && response.headers['content-type'])
      || resolveBodyType(response.body);

    const preparedResponse: HttpResponse = {
      ...response,
      status: response.status || 200,
      headers: omitUndefined({
        ...response.headers,
        'content-type': contentType,
      }),
      body: prepareBody(contentType, response.body),
    };

    return omitUndefined(preparedResponse) as HttpResponse;
  }

  private startServerErrorResponse(err: string): HttpResponse {
    return {
      headers: {
        'content-type': 'text/plain',
      },
      status: 500,
      body: err,
    };
  }

}
