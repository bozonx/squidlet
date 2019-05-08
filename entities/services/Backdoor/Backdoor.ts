import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer
} from '../../drivers/WebSocketServer/WebSocketServer';
import {isUint8Array} from 'system/helpers/collections';
import {decodeJsonMessage, encodeJsonMessage} from './helpers';
import {WsServerLogicProps} from '../../drivers/WebSocketServer/WsServerLogic';


export enum BACKDOOR_DATA_TYPES {
  json,
}

export enum BACKDOOR_MESSAGE_TYPE {
  emit,
  addListener,
  listenerResponse,
  //removeListener,
}

export interface BackdoorMessage {
  type: number;
  payload: {
    category: string;
    topic?: string;
    data?: string;
  };
}

// contents [category, topic, handlerIndex]
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
      // start listening income message of this connection
      this.wsServer.onMessage(connectionId, (data: string | Uint8Array) => {
        // parse message
        this.handleIncomeMessage(connectionId, data);
      });
    });

    this.wsServer.onConnectionClose((connectionId: string) => {
      // TODO: убить все хэндлеры привязанные к connection
      // TODO: on close connection - remove all the listeners
    });
  }

  destroy = async () => {

    // TODO: remove all the handlers

    await this.wsServer.destroy();
  }


  private handleIncomeMessage(connectionId: string, data: string | Uint8Array) {
    if (!isUint8Array(data)) {
      return this.env.log.error(`Backdoor: data has be a Uint8Array`);
    }
    else if (data.length <= 1) {
      return this.env.log.error(`Backdoor: income data is too small`);
    }

    if (data[0] === BACKDOOR_DATA_TYPES.json) {
      let message: BackdoorMessage;

      try {
        message = decodeJsonMessage(data as Uint8Array) as any;
      }
      catch (err) {
        return this.env.log.error(`Can't decode message: ${err}`);
      }

      return this.resolveJsonMessage(connectionId, message);
    }

    // TODO: bin message for updating etc...

    throw new Error(`Backdoor: unsapported type of message "${data[0]}"`);
  }

  private resolveJsonMessage(connectionId: string, message: BackdoorMessage) {
    switch (message.type) {
      case BACKDOOR_MESSAGE_TYPE.emit:
        return this.env.events.emit(message.payload.category, message.payload.topic, message.payload.data);
      case BACKDOOR_MESSAGE_TYPE.addListener:
        return this.addEventListener(connectionId, message.payload.category, message.payload.topic);
      case BACKDOOR_MESSAGE_TYPE.removeListener:
        return this.removeEventListener(connectionId, message.payload.category, message.payload.topic);
      default:
        this.env.log.error(`Backdoor: Can't recognize message type "${message.type}"`);
    }
  }

  private addEventListener(connectionId: string, category: string, topic?: string) {
    let handlerIndex: number;

    if (topic) {
      handlerIndex = this.env.events.addListener(category, topic, (data: any) => {
        return this.sendEventResponseMessage(connectionId, category, topic, data);
      });
    }
    else {
      handlerIndex = this.env.events.addCategoryListener(category, (data: any) => {
        return this.sendEventResponseMessage(connectionId, category, topic, data);
      });
    }

    const handlerItem: HandlerItem = [category, topic, handlerIndex];

    if (!this.handlers[connectionId]) this.handlers[connectionId] = [];

    this.handlers[connectionId].push(handlerItem);
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


  private async sendEventResponseMessage(connectionId: string, category: string, topic?: string, data?: any) {
    const returnMessage: BackdoorMessage = {
      type: BACKDOOR_MESSAGE_TYPE.listenerResponse,
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

}
