import IoSet from '../interfaces/IoSet';
import WebSocketServerIo from '../interfaces/io/WebSocketServerIo';
import HostConfig from '../interfaces/HostConfig';
import {pathJoin} from '../lib/paths';
import systemConfig from '../systemConfig';
import StorageIo from '../interfaces/io/StorageIo';
import {ShutdownHandler} from '../System';
import IoItem, {IoDefinitions} from '../interfaces/IoItem';
// TODO: use ioSet's - use driver
import WsServerLogic from '../../entities/drivers/WsServer/WsServerLogic';

import IoServerConnection from './IoServerConnection';
import IoServerHttpApi from './IoServerHttpApi';


export default class IoServer {
  private readonly ioSet: IoSet;
  private readonly shutdownRequest: ShutdownHandler;
  private _hostConfig?: HostConfig;
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private _wsServer?: WsServerLogic;
  private ioConnection?: IoServerConnection;
  private httpApi?: IoServerHttpApi;

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
    this._hostConfig = await this.loadConfig<HostConfig>(systemConfig.fileNames.hostConfig);

    this.logInfo('--> Configuring Io');
    await this.configureIoSet();

    this.logInfo('--> Initializing websocket and http servers');
    await this.startHttpApi();
    await this.initWsIoServer();

    this.logInfo('===> IoServer initialization has been finished');
  }

  destroy = async () => {
    this.logInfo('... destroying IoServer');
    this.httpApi && await this.httpApi.init();
    this.ioConnection && await this.ioConnection.destroy();
    await this.wsServer.destroy();

    delete this.ioConnection;
  }


  private handleNewIoClientConnection = async (connectionId: string) => {
    if (this.ioConnection) {
      const msg = `Only one connection is allowed`;

      this.logError(msg);
      await this.wsServer.closeConnection(connectionId, 1, msg);

      return;
    }

    this.ioConnection = new IoServerConnection(
      connectionId,
      this.ioSet,
      this.hostConfig,
      this.wsServer.send,
      this.logDebug,
      this.logError
    );

    // stop IoServer's http api server to not to busy the port
    this.httpApi && await this.httpApi.destroy();

    delete this.httpApi;

    this.ioConnection.setReadyState();

    this.logInfo(`New IO client has been connected`);
  }

  private handleIoClientCloseConnection = async () => {
    this.ioConnection && await this.ioConnection.destroy();

    delete this.ioConnection;

    this.logInfo(`IO client has been disconnected`);
    this.logInfo(`Starting own http api`);
    await this.startHttpApi();
  }

  private async startHttpApi() {
    this.httpApi = new IoServerHttpApi(
      this.ioSet,
      this.hostConfig,
      this.shutdownRequest,
      this.logDebug,
      this.logInfo,
      this.logError
    );

    await this.httpApi.init();
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
    const ioParams = await this.loadConfig<IoDefinitions>(
      systemConfig.fileNames.iosDefinitions
    );

    for (let ioName of Object.keys(ioParams)) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      ioItem.configure && await ioItem.configure(ioParams[ioName]);
    }
  }

}
