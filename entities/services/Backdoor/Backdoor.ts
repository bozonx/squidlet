import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import {decodeBackdoorMessage, makeMessage} from './helpers';
import {WebSocketServerProps} from 'system/interfaces/io/WebSocketServerIo';
import RemoteCallMessage from 'system/interfaces/RemoteCallMessage';
import IoSetServerLogic from './IoSetServerLogic';
import {WsServerSessions} from '../../drivers/WsServerSessions/WsServerSessions';


export enum BACKDOOR_ACTION {
  emit,
  addListener,
  listenerResponse,
  removeListener,
  ioSetRemoteCall,
  getIoNames,
}


// TODO: для ioSet буде другой payload

/*
{
    category: string;
    topic?: string;
    data?: any;
  }
 */

export interface BackdoorMessage {
  action: number;
  payload: any;
}

enum HANDLER_ITEM_POS {
  category,
  topic,
  handlerIndex
}

// see HANDLER_ITEM_POS
type HandlerItem = [string, (string | undefined), number];


export default class Backdoor extends ServiceBase<WebSocketServerProps> {
  // TODO: review
  private readonly handlers: {[index: string]: HandlerItem[]} = {};
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
      // TODO: учитывать что соединение ещё не создалось !!!!
      // start listening income messages of this connection
      this.wsServerSessions.onMessage(sessionId, (data: string | Uint8Array) => {
        return this.handleIncomeMessage(sessionId, data);
      });
    });

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
      this.removeConnectionHandlers(connectionId);
    });
  }

  destroy = async () => {

    // TODO: review

    // remove all the handlers
    for (let connectionId of Object.keys(this.handlers)) {
      this.removeConnectionHandlers(connectionId);
    }

    await this.wsServer.destroy();
  }


  private sendIoSetMsg(message: RemoteCallMessage): Promise<void> {
    // TODO: add !!!!
  }

  private async handleIncomeMessage(sessionId: string, data: string | Uint8Array) {
    let message: BackdoorMessage;

    try {
      message = decodeBackdoorMessage(data as Uint8Array);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: Can't decode message: ${err}`);
    }

    try {
      await this.resolveJsonMessage(sessionId, message);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: ${err}`);
    }
  }

  private async resolveJsonMessage(sessionId: string, message: BackdoorMessage) {

    // TODO: use special api to ioSet - don't use events

    switch (message.action) {
      case BACKDOOR_ACTION.emit:
        // rise event on common event system
        return this.env.events.emit(message.payload.category, message.payload.topic, message.payload.data);
      case BACKDOOR_ACTION.addListener:
        return this.startListenEvents(sessionId, message.payload.category, message.payload.topic);
      case BACKDOOR_ACTION.removeListener:
        return this.removeEventListener(sessionId, message.payload.category, message.payload.topic);
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

  /**
   * Listen to event of common event system
   * and send it to backdoor client which has been subscribed to this event.
   */
  private startListenEvents(sessionId: string, category: string, topic?: string) {
    let handlerIndex: number;

    if (topic) {
      handlerIndex = this.env.events.addListener(category, topic, (data: any) => {
        return this.sendEventResponseMessage(connectionId, category, topic, data);
      });
    }
    else {
      handlerIndex = this.env.events.addCategoryListener(category, (data: any) => {
        return this.sendEventResponseMessage(connectionId, category, undefined, data);
      });
    }

    const handlerItem: HandlerItem = [category, topic, handlerIndex];

    if (!this.handlers[connectionId]) this.handlers[connectionId] = [];

    this.handlers[connectionId].push(handlerItem);
  }

  private async sendEventResponseMessage(connectionId: string, category: string, topic?: string, data?: any) {
    try {
      const binData: Uint8Array = makeMessage(BACKDOOR_ACTION.listenerResponse, category, topic, data);

      await this.wsServer.send(connectionId, binData);
    }
    catch (err) {
      this.env.log.error(`Backdoor: send error: ${err}`);
    }
  }

  private removeConnectionHandlers(connectionId: string) {
    if (!this.handlers[connectionId]) return;
    
    for (let handlerItem of this.handlers[connectionId]) {
      this.removeHandler(handlerItem);
    }

    delete this.handlers[connectionId];
  }

  private removeHandler(handlerItem: HandlerItem) {
    const category: string = handlerItem[HANDLER_ITEM_POS.category];
    const topic: string | undefined = handlerItem[HANDLER_ITEM_POS.topic];
    const handlerIndex: number = handlerItem[HANDLER_ITEM_POS.handlerIndex];

    if (topic) {
      this.env.events.removeListener(category, topic, handlerIndex);
    }
    else {
      this.env.events.removeCategoryListener(category, handlerIndex);
    }
  }

  /**
   * Remove all the handlers of specified category and topic
   */
  private removeEventListener(sessionId: string, category: string, topic?: string) {
    if (!this.handlers[connectionId]) return;

    for (let handlerItemIndex in this.handlers[connectionId]) {
      const handlerItem = this.handlers[connectionId][handlerItemIndex];
      if (
        category === handlerItem[HANDLER_ITEM_POS.category]
        && topic === handlerItem[HANDLER_ITEM_POS.topic]
      ) {
        this.removeHandler(handlerItem);

        // TODO: strongly test
        this.handlers[connectionId].splice(Number(handlerItemIndex), 1);
      }
    }
  }

}
