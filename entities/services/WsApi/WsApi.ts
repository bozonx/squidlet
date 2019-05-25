import {GetDriverDep} from 'system/entities/EntityBase';
import ServiceBase from 'system/baseServices/ServiceBase';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import {removeItemFromArray} from 'system/helpers/collections';
import {WsServerSessions, WsServerSessionsProps} from '../../drivers/WsServerSessions/WsServerSessions';


// TODO: может лучше использовать Channels driver ???


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
    this.wsServerSessions.onSessionClose((sessionId: string) => {
      this.sessions = removeItemFromArray(this.sessions, sessionId);
    });

    // listen income api requests
    this.wsServerSessions.onMessage(this.handleIncomeMessages);
    // listen outcome api requests
    this.env.api.onOutcomeRemoteCall(this.handleOutcomeMessages);
  }

  destroy = async () => {
    // TODO: destroy connections
    delete this.sessions;
  }

  private handleIncomeMessages(sessionId: string, data: string | Uint8Array) {
    const message: RemoteCallMessage = deserializeJson(data);

    this.env.api.incomeRemoteCall(message)
      .catch(this.env.log.error);
  }

  private handleOutcomeMessages(message: RemoteCallMessage) {
    const binData: Uint8Array = serializeJson(message);

    // send to all the clients
    for (let sessionId of this.sessions) {
      this.wsServerSessions.send(sessionId, binData)
        .catch(this.env.log.error);
    }
  }

}
