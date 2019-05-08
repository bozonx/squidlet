import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer
} from '../../drivers/WebSocketServer/WebSocketServer';
import {WsServerLogicProps} from '../../drivers/WebSocketServer/WsServerLogic';
import {decodeJsonMessage, encodeJsonMessage} from './helpers';


// export enum BACKDOOR_DATA_TYPES {
//   json,
// }

export enum BACKDOOR_ACTION {
  emit,
  addListener,
  listenerResponse,
  removeListener,
}

export interface BackdoorMessage {
  action: number;
  payload: {
    category: string;
    topic?: string;
    data?: string;
  };
}


enum HANDLER_ITEM_POS {
  category,
  topic,
  handlerIndex
}

// see HANDLER_ITEM_POS
type HandlerItem = [string, (string | undefined), number];


export default class Backdoor extends ServiceBase<WsServerLogicProps> {
  private readonly handlers: {[index: string]: HandlerItem[]} = {};
  private get wsServer(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance(this.props);

    this.wsServer.onConnection((connectionId: string) => {
      // start listening income messages of this connection
      this.wsServer.onMessage(connectionId, (data: string | Uint8Array) => {
        return this.handleIncomeMessage(connectionId, data);
      });
    });

    this.wsServer.onConnectionClose((connectionId: string) => {
      // remove all the listeners of this connection
      this.removeConnectionHandlers(connectionId);
    });
  }

  destroy = async () => {
    // remove all the handlers
    for (let connectionId of Object.keys(this.handlers)) {
      this.removeConnectionHandlers(connectionId);
    }

    await this.wsServer.destroy();
  }


  private async handleIncomeMessage(connectionId: string, data: string | Uint8Array) {
    let message: BackdoorMessage;

    try {
      message = decodeJsonMessage(data as Uint8Array) as any;
    }
    catch (err) {
      return this.env.log.error(`Backdoor: Can't decode message: ${err}`);
    }

    try {
      await this.resolveJsonMessage(connectionId, message);
    }
    catch (err) {
      return this.env.log.error(`Backdoor: ${err}`);
    }
  }

  private async resolveJsonMessage(connectionId: string, message: BackdoorMessage) {
    switch (message.action) {
      case BACKDOOR_ACTION.emit:
        // rise event on common event system
        return this.env.events.emit(message.payload.category, message.payload.topic, message.payload.data);
      case BACKDOOR_ACTION.addListener:
        return this.startListenEvents(connectionId, message.payload.category, message.payload.topic);
      case BACKDOOR_ACTION.removeListener:
        return this.removeEventListener(connectionId, message.payload.category, message.payload.topic);
      default:
        throw new Error(`Backdoor: Can't recognize message's action "${message.action}"`);
    }
  }

  /**
   * Listen to event of common event system
   * and send it to backdoor client which has been subscribed to this event.
   */
  private startListenEvents(connectionId: string, category: string, topic?: string) {
    let handlerIndex: number;

    if (topic) {
      handlerIndex = this.env.events.addListener(category, topic, (data: any) => {
        // TODO: handle error
        this.sendEventResponseMessage(connectionId, category, topic, data);
      });
    }
    else {
      handlerIndex = this.env.events.addCategoryListener(category, (data: any) => {
        // TODO: handle error
        this.sendEventResponseMessage(connectionId, category, topic, data);
      });
    }

    const handlerItem: HandlerItem = [category, topic, handlerIndex];

    if (!this.handlers[connectionId]) this.handlers[connectionId] = [];

    this.handlers[connectionId].push(handlerItem);
  }

  private async sendEventResponseMessage(connectionId: string, category: string, topic?: string, data?: any) {
    const returnMessage: BackdoorMessage = {
      type: BACKDOOR_ACTION.listenerResponse,
      payload: {
        category,
        topic,
        data,
      }
    };

    const binData: Uint8Array = encodeJsonMessage(returnMessage);

    try {
      await this.wsServerDriver.send(connectionId, binData);
    }
    catch (err) {
      this.env.log.error(`Backdoor: send error: ${err}`);
    }
  }
  
  private removeConnectionHandlers(connectionId: string) {
    if (!this.handlers[connectionId]) return;
    
    for (let handlerItem of this.handlers[connectionId]) {
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

    delete this.handlers[connectionId];
  }

  private removeEventListener(connectionId: string, category: string, topic?: string) {
    // TODO: remove listeners
  }

  
  //
  // private onIoPub(payload: Uint8Array) {
  //   const message: RemoteCallMessage = uint8ArrayToJsData(payload);
  //
  //   this.env.events.emit(categories.ioSet, undefined, message.data);
  // }
  //
  // private onIoSub(clientId: string, payload: Uint8Array) {
  //   const message: RemoteCallMessage = uint8ArrayToJsData(payload);
  //
  //   // TODO: subscribe to io
  //   this.env.events.addCategoryListener(categories.ioSet, (data: any) => {
  //     //const instance: IoItem = this.env.system.ioSet.getInstance(ioName);
  //
  //     // TODO: это выход из ioSet - его перенаправляем на удаленный хост если он подписан
  //
  //   });
  // }
  //
  // private onUpdatePub(payload: Uint8Array) {
  //
  // }
  //
  // private onUpdateSub(clientId: string, payload: Uint8Array) {
  //   this.env.events.addCategoryListener(categories.updater, (data: any, topic: string) => {
  //     // TODO: !!!
  //   });
  // }
  //
  // private onLogSub(clientId: string, payload: Uint8Array) {
  //   // TODO: subscribe to log
  //   this.env.events.addCategoryListener(categories.logger, (data: any, level: string) => {
  //     // TODO: !!!
  //   });
  //
  // }
  //
  // private onSwitchIoAccess(payload: Uint8Array) {
  //   // TODO: convert to boolean
  // }
  
}
