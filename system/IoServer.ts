import IoSet from './interfaces/IoSet';
import {deserializeJson, serializeJson} from './lib/serialize';
import {WebSocketServerProps} from './interfaces/io/WebSocketServerIo';
import RemoteCall from './lib/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {makeUniqId} from './lib/uniqId';
import HostConfig from './interfaces/HostConfig';
import InitializationConfig from './interfaces/InitializationConfig';
import initializationConfig from './config/initializationConfig';
import {pathJoin} from './lib/nodeLike';
import systemConfig from './config/systemConfig';
import StorageIo from './interfaces/io/StorageIo';
// TODO: use ioSet's
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
// TODO: use ioSet's
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {ShutdownHandler} from './System';


export const IO_API = 'ioApi';
export const IO_NAMES_METHOD = 'getIoNames';
export const METHOD_DELIMITER = '.';
// TODO: use hostConfig default's
export const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
};


export default class IoServer {
  private readonly ioSet: IoSet;
  readonly shutdownRequest: ShutdownHandler;
  // user's set props of ioServer
  //private readonly ioServerProps: HostConfig['ioServer'];
  //private readonly rcResponseTimoutSec: number;
  private readonly logInfo: (msg: string) => void;
  private readonly logError: (msg: string) => void;
  private remoteCall?: RemoteCall;
  private connectionId?: string;
  private _wsServer?: WsServerLogic;

  private get wsServer(): WsServerLogic {
    return this._wsServer as any;
  }


  constructor(
    // it has to be initialized before
    ioSet: IoSet,
    shutdownRequestCb: ShutdownHandler,
    //ioServerProps: HostConfig['ioServer'],
    //rcResponseTimoutSec: number,
    // this.props.hostConfig.ioServer,
    // (this.props.hostConfig.config && this.props.hostConfig.config.rcResponseTimoutSec)
    //   ? this.props.hostConfig.config.rcResponseTimoutSec
    //   : hostDefaultConfig.config.rcResponseTimoutSec,
    logInfo: (msg: string) => void,
    logError: (msg: string) => void
  ) {
    this.ioSet = ioSet;
    this.shutdownRequest = shutdownRequestCb;
    //this.ioServerProps = ioServerProps;
    //this.rcResponseTimoutSec = rcResponseTimoutSec;
    this.logInfo = logInfo;
    this.logError = logError;
  }

  async start() {
    // TODO: !!!!????? host config может и не быть
    const hostConfig = await this.loadHostConfig();

    const wsServerIo = this.ioSet.getIo<WebSocketServerIo>('WebSocketServer');
    const props = await this.makeProps();

    this._wsServer = new WsServerLogic(
      wsServerIo,
      props,
      this.handleClose,
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

      // switch to normal app on connection close
      this.shutdownRequest('switchToApp');
    });
  }

  destroy = async () => {
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

    this.remoteCall = new RemoteCall(
      this.sendToClient,
      this.callIoApi,
      this.rcResponseTimoutSec,
      this.logError,
      makeUniqId
    );
  }

  private handleIncomeMessages = (connectionId: string, data: string | Uint8Array) => {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.logError(`IoServer: Can't decode message: ${err}`);
    }

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

    return this.wsServer.send(this.connectionId, binData);
  }

  private async callIoApi(fullName: string, args: any[]): Promise<any> {
    const [ioName, methodName] = fullName.split(METHOD_DELIMITER);

    if (!methodName) {
      throw new Error(`No method name: "${fullName}"`);
    }

    if (ioName === IO_API) {
      if (methodName === IO_NAMES_METHOD) return this.ioSet.getNames();

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

  private async makeProps(): Promise<WebSocketServerProps> {
    return {
      ...defaultProps,
      ...this.ioServerProps,
    };
  }

  private async loadHostConfig(): Promise<HostConfig> {
    // TODO: review
    const initCfg: InitializationConfig = initializationConfig();
    const pathToConfig = pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.configs,
      initCfg.fileNames.hostConfig
    );

    const storage = this.ioSet.getIo<StorageIo>('Storage');
    const configStr: string = await storage.readFile(pathToConfig);

    return JSON.parse(configStr);
  }

}
