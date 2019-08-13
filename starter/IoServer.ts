import IoSet from '../system/interfaces/IoSet';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {WebSocketServerProps} from '../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';
import {makeUniqId} from '../system/lib/uniqId';


// localhost:8089

const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
}


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

    this.wsServer.onConnectionClose((connectionId: string) => {
      this.connectionId = undefined;

      this.remoteCall && this.remoteCall.destroy()
        .catch(this.logError);
    });
  }


  destroy = async () => {
    await this.wsServer.destroy();
    this.remoteCall && await this.remoteCall.destroy();
  }


  private async callIo(fullName: string, args: any[]): Promise<any> {
    // TODO: распарсить methodName на ioName и methodName

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioSet.getIo(ioName);

    return IoItem[methodName](...args);
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

  private handleNewConnection = (connectionId: string) => {
    if (!this.connectionId) return;

    const msg = `Only one connection is allowed`;
    this.logError(msg);

    this.wsServer.closeConnection(connectionId, 1, msg)
      .catch(this.logError);
  }

  private handleIncomeMessages = (connectionId: string, data: string | Uint8Array) => {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.logError(`WsApi: Can't decode message: ${err}`);
    }

    return this.remoteCall.incomeMessage(msg);
  }

  private loInfo = (msg: string) => {
    // TODO: ошибки отправлять обратным сообщением
  }

  private logError = (msg: string) => {
    // TODO: ошибки отправлять обратным сообщением
  }

  private handleClose = () => {
    // TODO: !!!
  }
}
