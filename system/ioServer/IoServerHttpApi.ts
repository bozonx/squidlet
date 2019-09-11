import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from '../../entities/drivers/HttpServer/HttpServerLogic';
import {ParsedUrl, parseUrl} from '../lib/url';
import {prepareRoute} from '../lib/route';
import HostInfo from '../interfaces/HostInfo';
import {HttpApiBody} from '../../entities/services/HttpApi/HttpApi';
import {HttpServerIo, HttpServerProps} from '../interfaces/io/HttpServerIo';

export default class IoServerHttpApi {
  private httpServer?: HttpServerLogic;


  constructor() {

  }

  async init() {
    // TODO: где берем хост и порт???
    const props: HttpServerProps = { host: '0.0.0.0', port: 8087 };
    const httpServerIo = this.ioSet.getIo<HttpServerIo>('HttpServer');

    this.httpServer = new HttpServerLogic(
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

    delete this.httpServer;
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

    const info: HostInfo = {
      hostType: 'ioServer',
      platform: this.hostConfig.platform,
      machine: this.hostConfig.machine,
      usedIo: this.ioSet.getNames(),
    };

    const body: HttpApiBody = {
      result: info,
    };

    return { body };
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
