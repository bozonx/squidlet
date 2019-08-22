import IoSet from '../system/interfaces/IoSet';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {WebSocketServerProps} from '../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import {makeUniqId} from '../system/lib/uniqId';
import HostConfig from '../system/interfaces/HostConfig';
import StorageIo from '../system/interfaces/io/StorageIo';
import {pathJoin} from '../system/lib/nodeLike';
import systemConfig from '../system/config/systemConfig';
import initializationConfig from '../system/config/initializationConfig';
import InitializationConfig from '../system/interfaces/InitializationConfig';


export const IO_API = 'ioApi';
export const IO_NAMES_METHOD = 'getIoNames';
export const METHOD_DELIMITER = '.';
export const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
};


export default class IoServer {
  private readonly ioSet: IoSet;
  private remoteCall?: RemoteCall;
  private connectionId?: string;
  private _wsServer?: WsServerLogic;
  private _hostConfig?: HostConfig;

  private get wsServer(): WsServerLogic {
    return this._wsServer as any;
  }

  private get hostConfig(): HostConfig {
    return this._hostConfig as any;
  }


  constructor(ioSet: IoSet) {
    this.ioSet = ioSet;
  }

  async init() {
    const wsServerIo = this.ioSet.getIo<WebSocketServerIo>('WebSocketServer');
    const props = await this.makeProps();

    this._hostConfig = await this.loadHostConfig();

    this._wsServer = new WsServerLogic(
      wsServerIo,
      props,
      this.handleClose,
      this.loInfo,
      this.logError,
    );

    await this.wsServer.init();

    this.wsServer.onMessage(this.handleIncomeMessages);
    this.wsServer.onConnection(this.handleNewConnection);
    this.wsServer.onConnectionClose(() => {
      this.connectionId = undefined;

      this.remoteCall && this.remoteCall.destroy()
        .catch(this.logError);
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
      // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
      this.sendToClient,
      this.callIo,
      // TODO: merge with ioServer or host's config - ioSetResponseTimoutSec
      30,
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

  private async callIo(fullName: string, args: any[]): Promise<any> {
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

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioSet.getIo(ioName);

    if (!IoItem[methodName]) {
      throw new Error(`Method doesn't exist: "${fullName}"`);
    }

    return IoItem[methodName](...args);
  }

  private loInfo = (msg: string) => {
    console.info(msg);
  }

  private logError = (msg: string) => {
    console.error(msg);
  }

  private handleClose = () => {
    console.error(`Websocket server was closed`);
  }

  private async loadHostConfig(): Promise<HostConfig> {
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

  private async makeProps(): Promise<WebSocketServerProps> {

    return {
      ...this.hostConfig.ioServer,
      ...defaultProps,
    };
  }

}
