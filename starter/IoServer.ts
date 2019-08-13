import IoSet from '../system/interfaces/IoSet';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {ConnectionParams, WebSocketServerProps} from '../system/interfaces/io/WebSocketServerIo';
import WsServerLogic from '../entities/drivers/WsServer/WsServerLogic';
import RemoteCall from '../system/lib/remoteCall/RemoteCall';
import systemConfig from '../system/config/systemConfig';
import RemoteCallMessage from '../system/interfaces/RemoteCallMessage';


// localhost:8089

const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
}


export default class IoServer {
  private readonly ioSet: IoSet;
  private readonly wsServer: WsServerLogic;
  private remoteCall: RemoteCall;
  //private connectionId?: string;


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

    this.remoteCall = new RemoteCall(
      // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
      this.sendBack,
      this.callIo,
      // TODO: merge with ioServer or host's config - ioSetResponseTimoutSec
      30,
      this.logError,
      this.system.generateUniqId
    );
  }

  async init() {


    // this.depsInstances.wsServer = await this.ioSet.getIo<WsServerSessions>('WsServerSessions')
    //   .getInstance(this.props);

    // this.wsServerSessions.onNewSession((sessionId: string) => {
    //   this.sessions.push(sessionId);
    // });

    // listen outcome api requests
    //this.env.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);


    // TODO: добавить переопределение props - см в конфиге
    //this.serverId = await this.wsServer.newServer(defaultProps);

    // await this.wsServer.onConnection(this.serverId, (connectionId: string) => {
    //   // TODO: отправить ошибку на это же соединение
    //   if (this.connectionId) return this.logError(`Only one connection is allowed`);
    // });
    //
    // await this.wsServer.onClose(this.serverId, () => {
    //   //await this.env.system.apiManager.remoteCallSessionClosed(sessionId);
    // });
    //
    // await this.wsServer.onMessage(this.serverId, (connectionId: string, data: string | Uint8Array) => {
    //   if (this.connectionId !== connectionId) return this.logError(`Only one connection is allowed`);
    // });
    //
    // await this.wsServer.onError(this.serverId, (connectionId: string, err: Error) => {
    //   if (this.connectionId !== connectionId) return this.logError(`Only one connection is allowed`);
    // });
    //
    // await this.wsServer.onUnexpectedResponse(this.serverId, (connectionId: string, response: ConnectionParams) => {
    //   if (this.connectionId !== connectionId) return this.logError(`Only one connection is allowed`);
    // });

    await this.wsServer.init();

    this.wsServer.onMessage(this.handleIncomeMessages);

    this.wsServer.onConnection((connectionId: string) => {
      // TODO: !!!
    });

    this.wsServer.onConnectionClose((connectionId: string) => {
      // TODO: !!!
      //await this.env.system.apiManager.remoteCallSessionClosed(sessionId);
    });
  }


  destroy = async () => {
    await this.wsServer.destroy();
  }


  private async callIo(methodName: string, args: any[]): Promise<any> {
    return (this.system.api as any)[methodName](...args);
  }

  private sendBack = (message: RemoteCallMessage): Promise<void> => {
    // TODO: !!!
  }

  private handleIncomeMessages = (connectionId: string, data: string | Uint8Array) => {
    if (!this.sessions.includes(sessionId)) return;

    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.env.log.error(`WsApi: Can't decode message: ${err}`);
    }

    return this.env.system.apiManager.incomeRemoteCall(sessionId, msg);
  };

  private handleOutcomeMessages = (sessionId: string, message: RemoteCallMessage) => {
    let binData: Uint8Array;

    try {
      binData = serializeJson(message);
    }
    catch (err) {
      return console.error(err);
    }

    this.wsServerSessions.send(sessionId, binData)
      .then(console.log)
      .catch(console.error);
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
