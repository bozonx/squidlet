import {ParsedUrl, parseUrl} from '../lib/url';
import {prepareRoute} from '../lib/route';
import HostInfo from '../interfaces/HostInfo';
import {HttpServerIo, HttpServerProps} from '../interfaces/io/HttpServerIo';
import {HttpApiBody} from '../../entities/services/HttpApi/HttpApi';
import IoSet from '../interfaces/IoSet';
import HostConfig from '../interfaces/HostConfig';
// TODO: use from system's interfaces
import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from '../../entities/drivers/HttpServer/HttpServerLogic';
import {ShutdownHandler} from '../System';
import SysIo from '../interfaces/io/SysIo';
import StorageIo from '../interfaces/io/StorageIo';
import {pathJoin} from '../lib/paths';
import systemConfig from '../systemConfig';
import {START_APP_TYPE_FILE_NAME} from '../constants';
import {AppType} from '../interfaces/AppType';


const SWITCH_TO_APP_TIMEOUT_SEC = 5;


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
      return this.makeHttpApiErrorResponse(`Unsupported api call: no path part in the url`);
    }

    const preparedPath: string = prepareRoute(parsedUrl.path);
    let body: HttpApiBody;

    if (preparedPath === '/api/info') {
      body = this.apiHostInfo();
    }
    else if (preparedPath === '/api/switchToApp') {
      body = await this.apiSwitchToApp();
    }
    else if (preparedPath === '/api/reboot') {
      body = this.apiReboot();
    }
    else {
      return this.makeHttpApiErrorResponse(`Unsupported api call: "${preparedPath}"`);
    }

    return { body: body as {[index: string]: any} };
  }

  private apiReboot(): HttpApiBody {
    const Sys = this.ioSet.getIo<SysIo>('Sys');

    setTimeout(() => {
      Sys.reboot()
        .catch(this.logError);
    }, this.hostConfig.config.rebootDelaySec * 1000);

    return { result: `It will be rebooted in ${this.hostConfig.config.rebootDelaySec} seconds` };
  }

  private async apiSwitchToApp(): Promise<HttpApiBody> {

    // TODO: запертить переключаться если standalone

    const storageIo: StorageIo = await this.ioSet.getIo<StorageIo>('Storage');
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.tmp,
      START_APP_TYPE_FILE_NAME,
    );
    const ioServerAppType: AppType = 'app';

    await storageIo.writeFile(startAppTypeFileName, ioServerAppType);

    setTimeout(() => {
      this.ioSet.ioManager.getIo<SysIo>('Sys').restart();
    }, SWITCH_TO_APP_TIMEOUT_SEC * 1000);

    return { result: `Switching to the app in ${SWITCH_TO_APP_TIMEOUT_SEC} second` };
  }

  private apiHostInfo(): HttpApiBody {
    const hostInfo: HostInfo = {
      hostType: 'ioServer',
      platform: this.hostConfig.platform,
      machine: this.hostConfig.machine,
      usedIo: this.ioSet.getNames(),
    };

    return { result: hostInfo as {[index: string]: any} };
  }

  private makeHttpApiErrorResponse(error: string): HttpDriverResponse {
    const body: HttpApiBody = {
      error,
    };

    return {
      status: 500,
      body: body as {[index: string]: any}
    };
  }

}
