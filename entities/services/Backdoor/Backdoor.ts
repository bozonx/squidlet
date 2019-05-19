import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {decodeBackdoorMessage, validateMessage} from './helpers';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import IoSetServer from './IoSetServer';
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
  // io servers by sessionId
  private readonly ioSets: {[index: string]: IoSetServer} = {};
  private _eventsServer?: MainEventsServer;
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer as any;
  }
  private get eventsServer(): MainEventsServer {
    return this._eventsServer as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServer = await getDriverDep('WsServerSessions')
      .getInstance(this.props);

    this.wsServerSessions.onNewSession((sessionId: string) => {
      this.ioSets[sessionId] = new IoSetServer(
        this.env.system.ioManager,
        (data: Uint8Array) => this.sendIoSetMsg(sessionId, data),
        this.env.config.config.ioSetResponseTimoutSec,
        this.env.log.error,
        this.env.system.host.generateUniqId
      );
    });

    this.wsServerSessions.onMessage(this.handleIncomeMessage);

    this.wsServerSessions.onSessionClose((sessionId: string) => {
      // remove all the listeners of this connection
      this.eventsServer.removeSessionHandlers(sessionId);
      this.ioSets[sessionId].destroy();
      delete this.ioSets[sessionId];
    });

    this._eventsServer = new MainEventsServer(
      this.env.events,
      this.wsServerSessions.send,
      this.env.log.error
    );
  }

  destroy = async () => {
    for (let sessionId of Object.keys(this.ioSets)) {
      await this.ioSets[sessionId].destroy();
      delete this.ioSets[sessionId];
    }

    this.eventsServer.destroy();
    await this.wsServerSessions.destroy();
    delete this._eventsServer;
  }


  private sendIoSetMsg(sessionId: string, data: Uint8Array): Promise<void> {

    // TODO: преобразовывать в backdoor message

    return this.wsServerSessions.send(sessionId, data);
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

  private async resolveJsonMessage(sessionId: string, msg: BackdoorMessage) {
    switch (msg.action) {
      case BACKDOOR_ACTION.emit:
        // rise event on common event system
        return this.eventsServer.emit(msg.payload);

      case BACKDOOR_ACTION.startListen:
        return this.eventsServer.startListenEvents(sessionId, msg.payload);

      case BACKDOOR_ACTION.ioSetRemoteCall:
        if (!this.ioSets[sessionId]) {
          return this.env.log.error(`Can't find registered ioSet server by session "${sessionId}"`);
        }

        return this.ioSets[sessionId].incomeMessage(sessionId, msg.payload);

      case BACKDOOR_ACTION.getIoNames:
        return this.respondIoNames(sessionId, msg.requestId as string);

      default:
        throw new Error(`Backdoor: Can't recognize message's action "${msg.action}"`);
    }
  }

  private async respondIoNames(sessionId: string, requestId: string) {
    if (!this.ioSets[sessionId]) {
      return this.env.log.error(`Can't find registered ioSet server by session "${sessionId}"`);
    }

    const msg: BackdoorMessage = {
      type: BACKDOOR_MSG_TYPE.respond,
      action: BACKDOOR_ACTION.getIoNames,
      requestId,
      payload: this.ioSets[sessionId].getIoNames(),
    };
  }

}
