import IoSet from './interfaces/IoSet';
import WebSocketServerIo from './interfaces/io/WebSocketServerIo';
import HostConfig from './interfaces/HostConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './initializationConfig';
import {pathJoin} from './lib/paths';
import systemConfig from './systemConfig';
import StorageIo from './interfaces/io/StorageIo';
import {ShutdownHandler} from './System';
import IoItem, {IoItemDefinition} from './interfaces/IoItem';
import {HttpServerIo, HttpServerProps} from './interfaces/io/HttpServerIo';
import {ParsedUrl, parseUrl} from './lib/url';
import {prepareRoute} from './lib/route';
import HostInfo from './interfaces/HostInfo';
// TODO: use from system's interfaces
import {HttpApiBody} from '../entities/services/HttpApi/HttpApi';
// TODO: use from system's interfaces
import HttpServerLogic, {HttpDriverRequest, HttpDriverResponse} from '../entities/drivers/HttpServer/HttpServerLogic';
// TODO: use ioSet's - use driver
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';

import IoServerConnection from './IoServerConnection';



export const METHOD_DELIMITER = '.';
const initCfg: InitializationConfig = initializationConfig();


export default class IoServer {
  private readonly ioSet: IoSet;
  private readonly shutdownRequest: ShutdownHandler;
  private _hostConfig?: HostConfig;
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private connectionId?: string;
  private httpServer?: HttpServerLogic;
  private _wsServer?: WsServerLogic;
  private ioConnection?: IoServerConnection;

  private get hostConfig(): HostConfig {
    return this._hostConfig as any;
  }

  private get wsServer(): WsServerLogic {
    return this._wsServer as any;
  }


  constructor(
    // initialized ioSet
    ioSet: IoSet,
    shutdownRequestCb: ShutdownHandler,
    logDebug: (msg: string) => void,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void
  ) {
    this.ioSet = ioSet;
    this.shutdownRequest = shutdownRequestCb;
    this.logDebug = logDebug;
    this.logInfo = logInfo;
    this.logError = logError;
  }

  async start() {
    this._hostConfig = await this.loadConfig<HostConfig>(initCfg.fileNames.hostConfig);

    this.logInfo('--> Configuring Io');
    await this.configureIoSet();

    this.logInfo('--> Initializing websocket and http servers');
    await this.initHttpApiServer();
    await this.initWsIoServer();

    this.logInfo('===> IoServer initialization has been finished');
  }

  destroy = async () => {
    this.logInfo('... destroying IoServer');
    this.httpServer && await this.httpServer.destroy();
    await this.wsServer.destroy();
    this.ioConnection && await this.ioConnection.destroy();

    delete this.httpServer;
    delete this.ioConnection;
  }


  private handleNewIoClientConnection = async (connectionId: string) => {
    if (this.connectionId) {
      const msg = `Only one connection is allowed`;

      this.logError(msg);
      await this.wsServer.closeConnection(connectionId, 1, msg);

      return;
    }

    // TODO: move to ioConnection
    this.connectionId = connectionId;
    this.ioConnection = new IoServerConnection(this.connectionId, this.logDebug, this.logError);

    await this.ioConnection.init();

    // stop IoServer's http api server to not to busy the port
    this.httpServer && await this.httpServer.destroy();

    delete this.httpServer;

    this.logInfo(`New IO client has been connected`);
  }

  private handleIoClientCloseConnection = async () => {
    delete this.connectionId;

    this.ioConnection && await this.ioConnection.destroy();

    // TODO: что если destroy не прошел

    delete this.ioConnection;

    this.logInfo(`IO client has been disconnected`);
  }

  private async loadConfig<T>(configFileName: string): Promise<T> {
    const pathToFile = pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.configs,
      configFileName
    );

    const storage = this.ioSet.getIo<StorageIo>('Storage');
    const configStr: string = await storage.readFile(pathToFile);

    return JSON.parse(configStr);
  }

  private async initHttpApiServer() {
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

  private async initWsIoServer() {
    if (!this.hostConfig.ioServer) {
      throw new Error(`Can't init ioServer because it isn't allowed in a host config`);
    }

    const wsServerIo = this.ioSet.getIo<WebSocketServerIo>('WebSocketServer');
    const props = this.hostConfig.ioServer;

    this._wsServer = new WsServerLogic(
      wsServerIo,
      props,
      () => this.logError(`Websocket server has been closed`),
      this.logDebug,
      this.logInfo,
      this.logError,
    );

    await this.wsServer.init();

    this.wsServer.onMessage((connectionId: string, data: string | Uint8Array) => {
      if (!this.ioConnection) {
        return this.logError(`IoServer.onMessage: no ioConnection`);
      }

      this.ioConnection.incomeMessage(connectionId, data)
        .catch(this.logError);
    });
    this.wsServer.onConnection((connectionId: string) => {
      this.handleNewIoClientConnection(connectionId)
        .catch(this.logError);
    });
    this.wsServer.onConnectionClose(() => {
      this.handleIoClientCloseConnection()
        .catch(this.logError);
    });
  }

  private async configureIoSet() {
    const ioParams = await this.loadConfig<IoItemDefinition>(
      initCfg.fileNames.iosDefinitions
    );

    for (let ioName of Object.keys(ioParams)) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      ioItem.configure && await ioItem.configure(ioParams[ioName]);
    }
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
