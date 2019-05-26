import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {deserializeJson, serializeJson} from 'system/helpers/binaryHelpers';
import {removeItemFromArray} from 'system/helpers/collections';
import {WsServerSessions} from '../../drivers/WsServerSessions/WsServerSessions';


// TODO: использовать общй код с WsApi


export default class Backdoor extends ServiceBase<WebSocketServerProps> {
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
    for (let sessionId of this.sessions) {
      await this.wsServerSessions.close(sessionId);
    }

    delete this.sessions;
  }


  private handleIncomeMessages = async (sessionId: string, data: string | Uint8Array) => {
    let msg: RemoteCallMessage;

    try {
      msg = deserializeJson(data);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: Can't decode message: ${err}`);
    }

    this.env.api.incomeRemoteCall(msg)
      .catch(this.env.log.error);
  }

  private handleOutcomeMessages = (message: RemoteCallMessage) => {
    const binData: Uint8Array = serializeJson(message);

    // send to all the clients
    for (let sessionId of this.sessions) {
      this.wsServerSessions.send(sessionId, binData)
        .catch(this.env.log.error);
    }
  }

}
