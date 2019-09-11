import {ParsedUrl, parseUrl} from '../lib/url';
import {prepareRoute} from '../lib/route';
import HostInfo from '../interfaces/HostInfo';
import {HttpServerIo, HttpServerProps} from '../interfaces/io/HttpServerIo';
import {HttpApiBody} from '../../entities/services/HttpApi/HttpApi';
import IoSet from '../interfaces/IoSet';
import HostConfig from '../interfaces/HostConfig';
// TODO: use from system's interfaces
import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from '../../entities/drivers/HttpServer/HttpServerLogic';


export default class IoServerHttpApi {
  private readonly ioSet: IoSet;
  private readonly hostConfig: HostConfig;
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private _httpServer?: HttpServerLogic;

  private get httpServer(): HttpServerLogic {
    return this._httpServer as any;
  }


  constructor(
    ioSet: IoSet,
    hostConfig: HostConfig,
    logDebug: (msg: string) => void,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void
  ) {
    this.ioSet = ioSet;
    this.hostConfig = hostConfig;
    this.logDebug = logDebug;
    this.logInfo = logInfo;
    this.logError = logError;
  }

  async init() {
    // TODO: где берем хост и порт???
    const props: HttpServerProps = { host: '0.0.0.0', port: 8087 };
    const httpServerIo = this.ioSet.getIo<HttpServerIo>('HttpServer');

    this._httpServer = new HttpServerLogic(
      httpServerIo,
      props,
      () => this.logError(`Http server has been closed`),
      this.logDebug,
      this.logInfo,
      this.logError,
    );

    await this.httpServer.init();

    this.httpServer.onRequest(this.handleHttpRequest);
  }

  async destroy() {
    await this.httpServer.destroy();

    delete this._httpServer;
  }


  private handleHttpRequest = async (request: HttpDriverRequest): Promise<HttpDriverResponse> => {
    const parsedUrl: ParsedUrl = parseUrl(request.url);

    if (!parsedUrl.path) {
      return this.makeHttpApiErrorResponse(`Unsupported api call: not path part in the url`);
    }

    const preparedPath: string = prepareRoute(parsedUrl.path);

    if (preparedPath !== '/api/info') {
      return this.makeHttpApiErrorResponse(`Unsupported api call: "${preparedPath}"`);
    }

    const body: HttpApiBody = {
      result: this.makeHostInfo(),
    };

    return { body };
  }

  private makeHostInfo(): HostInfo {
    return {
      hostType: 'ioServer',
      platform: this.hostConfig.platform,
      machine: this.hostConfig.machine,
      usedIo: this.ioSet.getNames(),
    };
  }

  private makeHttpApiErrorResponse(error: string): HttpDriverResponse {
    const body: HttpApiBody = {
      error,
    };

    return {
      status: 500,
      body
    };
  }
}
