import IoSet from '../system/interfaces/IoSet';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {WebSocketServerProps} from '../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import {makeUniqId} from '../system/lib/uniqId';


export const METHOD_DELIMITER = '.';
export const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
};


export default class IoServer {
  private readonly ioSet: IoSet;
  private readonly wsServer: WsServerLogic;
  private remoteCall?: RemoteCall;
  private connectionId?: string;


  constructor(ioSet: IoSet) {
    this.ioSet = ioSet;

    const wsServerIo = ioSet.getIo<WebSocketServerIo>('WebSocketServer');

    this.wsServer = new WsServerLogic(
      wsServerIo,
      // TODO: добавить переопределение props - см в конфиге
      defaultProps,
      this.handleClose,
      this.loInfo,
      this.logError,
    );
  }

  async init() {
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
      this.sendBack,
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
      return this.logError(`WsApi: Can't decode message: ${err}`);
    }

    return this.remoteCall && this.remoteCall.incomeMessage(msg);
  }

  private sendBack = async (message: RemoteCallMessage): Promise<void> => {
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
      return this.logError(`No method name: "${fullName}"`);
    }

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioSet.getIo(ioName);

    if (!IoItem[methodName]) {
      return this.logError(`Method doesn't exist: "${fullName}"`);
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
}
