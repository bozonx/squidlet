import IoSet from '../system/interfaces/IoSet';
import RemoteCallMessage from '../entities/services/WsApi/WsApi';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import WebSocketServerIo from '../nodejs/ios/WebSocketServer';
import {ConnectionParams, WebSocketServerProps} from '../system/interfaces/io/WebSocketServerIo';


// localhost:8089

const defaultProps: WebSocketServerProps = {
  host: 'localhost',
  port: 8089,
}


export default class IoServer {
  private readonly wsServer: WebSocketServerIo;
  private serverId: string = '';
  private connectionId?: string;


  constructor(ioSet: IoSet) {
    this.wsServer = ioSet.getIo<WebSocketServerIo>('WebSocketServer');
  }

  async init() {


    // this.depsInstances.wsServer = await this.ioSet.getIo<WsServerSessions>('WsServerSessions')
    //   .getInstance(this.props);

    // this.wsServerSessions.onNewSession((sessionId: string) => {
    //   this.sessions.push(sessionId);
    // });

    // this.wsServerSessions.onSessionClose(this.wrapErrors(async (sessionId: string) => {
    //   this.sessions = removeItemFromArray(this.sessions, sessionId);
    //
    //   await this.env.system.apiManager.remoteCallSessionClosed(sessionId);
    // }));



    // listen income api requests
    //this.wsServerSessions.onMessage(this.handleIncomeMessages);



    // listen outcome api requests
    //this.env.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);


    // TODO: добавить переопределение props - см в конфиге
    this.serverId = await this.wsServer.newServer(defaultProps);

    await this.wsServer.onConnection(this.serverId, (connectionId: string) => {
      // TODO: отправить ошибку на это же соединение
      if (this.connectionId) return this.logError(`Only one connection is allowed`);
    });

    await this.wsServer.onClose(this.serverId, () => {

    });

    await this.wsServer.onMessage(this.serverId, () => {

    });

    await this.wsServer.onError(this.serverId, () => {

    });

    await this.wsServer.onUnexpectedResponse(this.serverId, () => {

    });
  }


  destroy = async () => {
    for (let sessionId of this.sessions) {
      await this.wsServerSessions.close(sessionId);
    }

    delete this.sessions;
  }


  private handleIncomeMessages = this.wrapErrors(async (sessionId: string, data: string | Uint8Array) => {
    if (!this.sessions.includes(sessionId)) return;

    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.env.log.error(`WsApi: Can't decode message: ${err}`);
    }

    return this.env.system.apiManager.incomeRemoteCall(sessionId, msg);
  });

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

  private logError(msg: string) {
    // TODO: ошибки отправлять обратным сообщением
  }
}
