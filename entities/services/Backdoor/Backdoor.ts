import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {decodeBackdoorMessage, makeMessage, validateMessage} from './helpers';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import IoSetServerLogic from './IoSetServerLogic';
import {WsServerSessions} from '../../drivers/WsServerSessions/WsServerSessions';


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

// category, topic, data
export type EventPayload = [string, (string | undefined), (any | undefined)];

export interface BackdoorMessage {
  type: number;
  action: number;
  payload: any;
  requestId?: string;
}

enum HANDLER_ITEM_POS {
  category,
  topic,
  handlerIndex
}

// see HANDLER_ITEM_POS
type EventHandlerItem = [string, (string | undefined), number];


export default class Backdoor extends ServiceBase<WebSocketServerProps> {
  // TODO: review
  private readonly eventHandlers: {[index: string]: EventHandlerItem[]} = {};
  private _ioSet?: IoSetServerLogic;
  private get wsServerSessions(): WsServerSessions {
    return this.depsInstances.wsServer as any;
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
      this.removeSessionHandlers(sessionId);
    });
  }

  destroy = async () => {

    // TODO: review

    // remove all the handlers
    for (let sessionId of Object.keys(this.eventHandlers)) {
      this.removeSessionHandlers(sessionId);
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
    const eventPayload: EventPayload = msg.payload;

    switch (msg.action) {
      case BACKDOOR_ACTION.emit:
        // rise event on common event system
        return this.env.events.emit(eventPayload[0], eventPayload[1], eventPayload[2]);
      case BACKDOOR_ACTION.startListen:
        return this.startListenEvents(sessionId, eventPayload[0], eventPayload[1]);
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

  /**
   * Listen to event of common event system
   * and send it to backdoor client which has been subscribed to this event.
   */
  private startListenEvents(sessionId: string, category: string, topic?: string) {
    let handlerIndex: number;

    if (topic) {
      handlerIndex = this.env.events.addListener(category, topic, (data: any) => {
        return this.sendEventResponseMessage(sessionId, category, topic, data);
      });
    }
    else {
      handlerIndex = this.env.events.addCategoryListener(category, (data: any) => {
        return this.sendEventResponseMessage(sessionId, category, undefined, data);
      });
    }

    const EventHandlerItem: EventHandlerItem = [category, topic, handlerIndex];

    if (!this.eventHandlers[sessionId]) this.eventHandlers[sessionId] = [];

    this.eventHandlers[sessionId].push(EventHandlerItem);
  }

  private async sendEventResponseMessage(sessionId: string, category: string, topic?: string, data?: any) {
    const payload: EventPayload = [ category, topic, data ];
    const binData: Uint8Array = makeMessage(
      BACKDOOR_MSG_TYPE.send,
      BACKDOOR_ACTION.listenerResponse,
      payload
    );

    try {
      await this.wsServerSessions.send(sessionId, binData);
    }
    catch (err) {
      this.env.log.error(`Backdoor: send error: ${err}`);
    }
  }

  /**
   * Remove all the event handlers of session.
   */
  private removeSessionHandlers(sessionId: string) {
    if (!this.eventHandlers[sessionId]) return;
    
    for (let eventHandlerItem of this.eventHandlers[sessionId]) {
      const category: string = eventHandlerItem[HANDLER_ITEM_POS.category];
      const topic: string | undefined = eventHandlerItem[HANDLER_ITEM_POS.topic];
      const handlerIndex: number = eventHandlerItem[HANDLER_ITEM_POS.handlerIndex];

      if (topic) {
        this.env.events.removeListener(category, topic, handlerIndex);
      }
      else {
        this.env.events.removeCategoryListener(category, handlerIndex);
      }
    }

    delete this.eventHandlers[sessionId];
  }

  // private handleIncomeIoSetRcMsg(sessionId: string, rawRemoteCallMessage: {[index: string]: any}) {
  //   this.ioSet.incomeMessage(sessionId, rawRemoteCallMessage)
  //     .catch(this.env.log.error);
  // }

  // /**
  //  * Remove all the handlers of specified category and topic
  //  */
  // private removeEventListener(sessionId: string, category: string, topic?: string) {
  //   if (!this.eventHandlers[connectionId]) return;
  //
  //   for (let EventHandlerItemIndex in this.eventHandlers[connectionId]) {
  //     const EventHandlerItem = this.eventHandlers[connectionId][EventHandlerItemIndex];
  //     if (
  //       category === EventHandlerItem[HANDLER_ITEM_POS.category]
  //       && topic === EventHandlerItem[HANDLER_ITEM_POS.topic]
  //     ) {
  //       this.removeHandler(EventHandlerItem);
  //
  //       // TODO: strongly test
  //       this.eventHandlers[connectionId].splice(Number(EventHandlerItemIndex), 1);
  //     }
  //   }
  // }

}
