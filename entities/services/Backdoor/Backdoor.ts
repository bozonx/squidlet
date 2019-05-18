import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {decodeBackdoorMessage, validateMessage} from './helpers';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import IoSetServerLogic from './IoSetServerLogic';
import {WsServerSessions} from '../../drivers/WsServerSessions/WsServerSessions';
import MainEventsServer from './MainEventsServer';


export enum BACKDOOR_MSG_TYPE {
  // send to one way. Don't wait to answer
  send,
  // send and wait to answer
  request,
  // response of request
  respond,
}

export enum BACKDOOR_ACTION {
  emit,
  startListen,
  listenerResponse,
  // removeListener,
  ioSetRemoteCall,
  getIoNames,
}


export interface BackdoorMessage {
  type: number;
  action: number;
  payload: any;
  requestId?: string;
}


export default class Backdoor extends ServiceBase<WebSocketServerProps> {
  private _ioSet?: IoSetServerLogic;
  private _eventsServer?: MainEventsServer;
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer as any;
  }
  private get eventsServer(): MainEventsServer {
    return this._eventsServer as any;
  }
  private get ioSet(): IoSetServerLogic {
    return this._ioSet as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServer = await getDriverDep('WsServerSessions')
      .getInstance(this.props);

    this.wsServerSessions.onNewSession((sessionId: string) => {
      // start listening income messages of this connection
      this.wsServerSessions.onMessage(sessionId, (data: string | Uint8Array) => {
        return this.handleIncomeMessage(sessionId, data);
      });
    });

    this._eventsServer = new MainEventsServer(
      this.env.events,
      this.wsServerSessions.send,
      this.env.log.error
    );

    // TODO: наверное запускать когда придет комманда или подсоединится клиент
    this._ioSet = new IoSetServerLogic(
      this.env.system.ioManager,
      this.sendIoSetMsg,
      this.env.config.config.ioSetResponseTimoutSec,
      this.env.log.error,
      this.env.system.host.generateUniqId
    );

    // TODO: review
    this.wsServerSessions.onSessionClose((sessionId: string) => {
      // remove all the listeners of this connection
      this.eventsServer.removeSessionHandlers(sessionId);
    });
  }

  destroy = async () => {

    // TODO: review

    // remove all the handlers
    for (let sessionId of Object.keys(this.eventHandlers)) {
      this.eventsServer.removeSessionHandlers(sessionId);
    }

    await this.wsServer.destroy();
  }


  private sendIoSetMsg(message: RemoteCallMessage): Promise<void> {
    // TODO: add !!!!
  }

  private async handleIncomeMessage(sessionId: string, data: string | Uint8Array) {
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

  private async resolveJsonMessage(sessionId: string, msg: BackdoorMessage) {
    switch (msg.action) {
      case BACKDOOR_ACTION.emit:
        // rise event on common event system
        return this.eventsServer.emit(msg.payload);
      case BACKDOOR_ACTION.startListen:
        return this.eventsServer.startListenEvents(sessionId, msg.payload);
      // case BACKDOOR_ACTION.removeListener:
      //   return this.removeEventListener(sessionId, message.payload.category, message.payload.topic);
      case BACKDOOR_ACTION.ioSetRemoteCall:
        //return this.handleIncomeIoSetRcMsg(sessionId, message.payload);
        return this.ioSet.incomeMessage(sessionId, message.payload);
      case BACKDOOR_ACTION.getIoNames:
        // TODO: отправить обратным сообщением
        //return this.ioSet.incomeMessage(sessionId, message.payload);
      default:
        throw new Error(`Backdoor: Can't recognize message's action "${message.action}"`);
    }
  }

  // private handleIncomeIoSetRcMsg(sessionId: string, rawRemoteCallMessage: {[index: string]: any}) {
  //   this.ioSet.incomeMessage(sessionId, rawRemoteCallMessage)
  //     .catch(this.env.log.error);
  // }

}
