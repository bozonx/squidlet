import IoSet from './interfaces/IoSet';
import {deserializeJson, serializeJson} from './lib/serialize';
import WebSocketServerIo from './interfaces/io/WebSocketServerIo';
import RemoteCall from './lib/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {makeUniqId} from './lib/uniqId';
import HostConfig from './interfaces/HostConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './initializationConfig';
import {pathJoin} from './lib/paths';
import systemConfig from './systemConfig';
import StorageIo from './interfaces/io/StorageIo';
import {ShutdownHandler} from './System';
// TODO: use ioSet's - use driver
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
import IoItem, {IoItemDefinition} from './interfaces/IoItem';


export const IO_API = 'ioApi';
export const IO_NAMES_METHOD = 'getIoNames';
export const METHOD_DELIMITER = '.';
const initCfg: InitializationConfig = initializationConfig();


export default class IoServer {
  private readonly ioSet: IoSet;
  private readonly shutdownRequest: ShutdownHandler;
  private hostConfig?: HostConfig;
  private readonly logDebug: (msg: string) => void;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private remoteCall?: RemoteCall;
  private connectionId?: string;
  private _wsServer?: WsServerLogic;

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
    this.hostConfig = await this.loadConfig<HostConfig>(initCfg.fileNames.hostConfig);

    this.logInfo('--> Configuring Io');
    await this.configureIoSet();

    this.logInfo('--> Initializing websocket server');
    await this.initWsServer();

    this.logInfo('===> IoServer initialization has been finished');
  }

  destroy = async () => {
    this.logInfo('... destroying IoServer');
    await this.wsServer.destroy();
    this.remoteCall && await this.remoteCall.destroy();
  }


  private handleNewConnection = (connectionId: string) => {
    if (this.connectionId) {
      const msg = `Only one connection is allowed`;

      this.logError(msg);
      this.wsServer.closeConnection(connectionId, 1, msg)
        .catch(this.logError);

      return;
    }

    this.connectionId = connectionId;

    if (!this.hostConfig) return this.logError(`No host config`);

    this.remoteCall = new RemoteCall(
      this.sendToClient,
      this.callIoApi,
      this.hostConfig.config.rcResponseTimoutSec,
      this.logError,
      makeUniqId
    );

    this.logInfo(`New IO client has been connected`);
  }

  private handleIncomeMessages = (connectionId: string, data: string | Uint8Array) => {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.logError(`IoServer: Can't decode message: ${err}`);
    }

    this.logDebug(`Income IO message: ${JSON.stringify(msg)}`);

    return this.remoteCall && this.remoteCall.incomeMessage(msg);
  }

  private sendToClient = async (message: RemoteCallMessage): Promise<void> => {
    if (!this.connectionId) return;

    let binData: Uint8Array;

    try {
      binData = serializeJson(message);
    }
    catch (err) {
      return this.logError(err);
    }

    this.logDebug(`Outcome IO message: ${JSON.stringify(message)}`);

    return this.wsServer.send(this.connectionId, binData);
  }

  // TODO: remake to HttpApi
  private callIoApi = async (fullName: string, args: any[]): Promise<any> => {
    const [ioName, methodName] = fullName.split(METHOD_DELIMITER);

    if (!methodName) {
      throw new Error(`No method name: "${fullName}"`);
    }

    if (ioName === IO_API) {
      if (methodName === IO_NAMES_METHOD) {
        return this.ioSet.getNames();
      }

      throw new Error(`Unknown ioApi method`);
    }

    return this.callIoMethod(ioName, methodName, args);
  }

  private async callIoMethod(ioName: string, methodName: string, args: any[]): Promise<any> {
    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioSet.getIo(ioName);

    if (!IoItem[methodName]) {
      throw new Error(`Method doesn't exist: "${ioName}.${methodName}"`);
    }

    return IoItem[methodName](...args);
  }

  private handleClose = () => {
    this.logError(`Websocket server was closed`);
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

  private async initWsServer() {
    if (!this.hostConfig || !this.hostConfig.ioServer) {
      throw new Error(`Can't init ioServer because it isn't allowed in a host config`);
    }

    const wsServerIo = this.ioSet.getIo<WebSocketServerIo>('WebSocketServer');
    const props = this.hostConfig.ioServer;

    this._wsServer = new WsServerLogic(
      wsServerIo,
      props,
      this.handleClose,
      this.logDebug,
      this.logInfo,
      this.logError,
    );

    await this.wsServer.init();

    this.wsServer.onMessage(this.handleIncomeMessages);
    this.wsServer.onConnection(this.handleNewConnection);
    this.wsServer.onConnectionClose(() => {
      this.connectionId = undefined;

      this.remoteCall && this.remoteCall.destroy()
        .catch(this.logError);

      this.logInfo(`IO client has been disconnected`);

      // TODO: может не делать этого - а делать запрос на переключение на app
      // switch to normal app on connection close
      //this.shutdownRequest('switchToApp');
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

}
