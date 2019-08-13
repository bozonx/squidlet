import IoSet from '../system/interfaces/IoSet';
import RemoteCallMessage from '../entities/services/WsApi/WsApi';
import {deserializeJson, serializeJson} from '../system/lib/binaryHelpers';
import {WsServerSessions} from '../entities/drivers/WsServerSessions/WsServerSessions';


// localhost:8089

export default class IoServer {
  private readonly ioSet: IoSet;


  constructor(ioSet: IoSet) {
    this.ioSet = ioSet;
  }

  async init() {
    // TODO: режим io сервера - нужен конфиг(запрашиваем в ioSet)
    // TODO: запретить больше 1й сессии одновременно
    // TODO: ошибки отправлять обратным сообщением
    // TODO: может не использовать драйвер - а сразу работать с io

    // TODO: это же драйвер!!!
    this.depsInstances.wsServer = await this.ioSet.getIo<WsServerSessions>('WsServerSessions')
      .getInstance(this.props);

    this.wsServerSessions.onNewSession((sessionId: string) => {
      this.sessions.push(sessionId);
    });

    this.wsServerSessions.onSessionClose(this.wrapErrors(async (sessionId: string) => {
      this.sessions = removeItemFromArray(this.sessions, sessionId);

      await this.env.system.apiManager.remoteCallSessionClosed(sessionId);
    }));

    // listen income api requests
    this.wsServerSessions.onMessage(this.handleIncomeMessages);

    // listen outcome api requests
    this.env.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);
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

}
