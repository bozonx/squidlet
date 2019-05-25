import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {decodeBackdoorMessage, makeMessage, validateMessage} from './helpers';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import {WsServerSessions} from '../../drivers/WsServerSessions/WsServerSessions';
import IoSetServer from './IoSetServer';
import MainEventsServer from './MainEventsServer';


export enum BACKDOOR_MSG_TYPE {
  // remoteCall interface
  apiRemoteCall,
  // ioSet remoteCall
  ioSet,
  // // send to one way. Don't wait to answer
  // send,
  // // send and wait to answer
  // request,
  // // response of request
  // respond,
}

// export enum BACKDOOR_ACTION {
//   emit,
//   startListen,
//   listenerResponse,
//   // removeListener,
//   ioSetRemoteCall,
//   getIoNames,
// }


export interface BackdoorMessage {
  type: number;
  payload: RemoteCallMessage;
  //action: number;
  //requestId?: string;
}


export default class Backdoor extends ServiceBase<WebSocketServerProps> {
  // io servers by sessionId
  private _ioSet?: IoSetServer;
  private _eventsServer?: MainEventsServer;
  private get ioSet(): IoSetServer {
    return this._ioSet as any;
  }
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer;
  }
  // private get eventsServer(): MainEventsServer {
  //   return this._eventsServer as any;
  // }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServer = await getDriverDep('WsServerSessions')
      .getInstance(this.props);

    // TODO: review

    // this.wsServerSessions.onNewSession((sessionId: string) => {
    // });

    this.wsServerSessions.onMessage(this.handleIncomeMessage);

    this.wsServerSessions.onSessionClose((sessionId: string) => {
      // remove all the listeners of this connection
      //this.eventsServer.removeSessionHandlers(sessionId);
      this.ioSet.sessionClosed(sessionId)
        .catch(this.env.log.error);
    });

    this._ioSet = new IoSetServer(
      this.env.system.ioManager,
      this.sendIoSetMsg,
      this.env.config.config.ioSetResponseTimoutSec,
      this.env.log.error,
      this.env.system.generateUniqId
    );

    // TODO: listen api to send to client

    // this._eventsServer = new MainEventsServer(
    //   this.env.events,
    //   this.wsServerSessions.send,
    //   this.env.log.error
    // );
  }

  destroy = async () => {
    //this.eventsServer.destroy();
    await this.ioSet.destroy();
    await this.wsServerSessions.destroy();
    delete this._eventsServer;
    delete this._ioSet;
  }


  private handleIncomeMessage = async (sessionId: string, data: string | Uint8Array) => {
    let msg: BackdoorMessage;

    try {
      msg = decodeBackdoorMessage(data);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: Can't decode message: ${err}`);
    }

    const validationError: string | undefined = validateMessage(msg);

    if (validationError) return this.env.log.error(validationError);

    try {
      await this.resolveJsonMessage(sessionId, msg);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: ${err}`);
    }
  }

  // TODO: remake
  private sendIoSetMsg(sessionId: string, message: RemoteCallMessage): Promise<void> {
    const binMsg: Uint8Array = makeMessage(
      BACKDOOR_MSG_TYPE.send,
      message,
    );

    return this.wsServerSessions.send(sessionId, binMsg);
  }

  private async resolveJsonMessage(sessionId: string, msg: BackdoorMessage) {
    switch (msg.type) {
      // case BACKDOOR_ACTION.emit:
      //   // rise event on common event system
      //   return this.eventsServer.emit(msg.payload);
      //
      // case BACKDOOR_ACTION.startListen:
      //   return this.eventsServer.startListenEvents(sessionId, msg.payload);

      case BACKDOOR_MSG_TYPE.ioSet:
        return this.ioSet.incomeMessage(sessionId, msg.payload);

      case BACKDOOR_MSG_TYPE.apiRemoteCall:
        return this.env.api.incomeRemoteCall(msg.payload);
        //return this.respondIoNames(sessionId, msg.requestId as string);

      default:
        throw new Error(`Backdoor: Can't recognize message's action "${msg.action}"`);
    }
  }

  // private async respondIoNames(sessionId: string, requestId: string) {
  //   const binMsg: Uint8Array = makeMessage(
  //     BACKDOOR_MSG_TYPE.respond,
  //     BACKDOOR_ACTION.getIoNames,
  //     this.ioSet.getIoNames(),
  //     requestId
  //   );
  //
  //   await this.wsServerSessions.send(sessionId, binMsg);
  // }

}
