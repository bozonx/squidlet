import {GetDriverDep} from 'system/base/EntityBase';
import ServiceBase from 'system/base/ServiceBase';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {deserializeJson, serializeJson} from 'system/lib/binaryHelpers';
import {removeItemFromArray} from 'system/lib/collections';
import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


// TODO: use Channels|Duplex driver


export default class WsApi extends ServiceBase<WsServerSessionsProps> {
  private sessions: string[] = [];
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServer = await getDriverDep('WsServerSessions')
      .getInstance(this.props);

    this.wsServerSessions.onNewSession((sessionId: string) => {
      this.sessions.push(sessionId);
    });

    this.wsServerSessions.onSessionClose(this.wrapErrors(async (sessionId: string) => {
      this.sessions = removeItemFromArray(this.sessions, sessionId);

      await this.context.system.apiManager.remoteCallSessionClosed(sessionId);
    }));

    // listen income api requests
    this.wsServerSessions.onMessage(this.handleIncomeMessages);

    // listen outcome api requests
    this.context.system.apiManager.onOutcomeRemoteCall(this.handleOutcomeMessages);
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
      return this.log.error(`WsApi: Can't decode message: ${err}`);
    }

    return this.context.system.apiManager.incomeRemoteCall(sessionId, msg);
  });

  private handleOutcomeMessages = this.wrapErrors(async (sessionId: string, message: RemoteCallMessage) => {
    const binData: Uint8Array = serializeJson(message);

    return this.wsServerSessions.send(sessionId, binData);
  });

}
