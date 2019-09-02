import {HttpServerIo, HttpServerProps} from 'system/interfaces/io/HttpServerIo';
import Promised from '../../../system/lib/Promised';
import {HttpMethods, HttpRequestHeaders, HttpResponseHeaders} from '../../../system/interfaces/io/HttpServerIo';


interface HttpDriverRequest {
  method: HttpMethods;
  url: string | string[];
  headers: HttpRequestHeaders;
  body?: string | {[index: string]: any} | Uint8Array;
}

interface HttpDriverResponse {
  headers: HttpResponseHeaders;
  status: number;
  body?: string | {[index: string]: any} | Uint8Array;
}


export default class HttpServerLogic {
  // it fulfils when server is start listening
  get listeningPromise(): Promise<void> {
    return this._listeningPromised.promise;
  }

  private readonly httpServerIo: HttpServerIo;
  private readonly props: HttpServerProps;
  private readonly logInfo: (message: string) => void;
  private readonly logError: (message: string) => void;
  private serverId: string = '';
  private _listeningPromised: Promised<void>;


  constructor(
    httpServerIo: HttpServerIo,
    props: HttpServerProps,
    logInfo: (message: string) => void,
    logError: (message: string) => void,
  ) {
    this.httpServerIo = httpServerIo;
    this.props = props;
    this.logInfo = logInfo;
    this.logError = logError;
    this._listeningPromised = new Promised<void>();
  }

  async init() {
    this.logInfo(`... Starting websocket server: ${this.props.host}:${this.props.port}`);
    this.serverId = await this.httpServerIo.newServer(this.props);

    await this.startListen();
  }

  async destroy() {
    if (!this.isInitialized()) {
      return this.logError(`HttpServerLogic.destroy: Server hasn't been initialized yet.`);
    }

    this.events.destroy();
    await this.httpServerIo.closeServer(this.serverId);
  }


  isInitialized(): boolean {
    return typeof this.serverId !== 'undefined';
  }


  onRequest(cb: (request: HttpDriverRequest) => Promise<HttpDriverResponse>) {
    // TODO: !!!
  }

  removeListener() {
    // TODO: !!!
  }


  private startListen() {
    // TODO: !!!
  }

}