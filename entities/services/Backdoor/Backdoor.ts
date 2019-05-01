import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer
} from '../../drivers/WebSocketServer/WebSocketServer';
import {isUint8Array} from 'system/helpers/collections';
import {decodeJsonMessage} from './helpers';


export enum BACKDOOR_DATA_TYPES {
  json,
}

export enum BACKDOOR_MESSAGE_TYPE {
  emit,
  addListener,
  removeListener,
  listenerResponse
}

export interface BackdoorMessage {
  type: number;
  payload: {
    category: string;
    topic?: string;
    data?: string;
  };
}

interface BackDoorProps {
  host: string;
  port: number;
}


export default class Backdoor extends ServiceBase<BackDoorProps> {
  private get wsServerDriver(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance(this.props);

    this.wsServerDriver.onConnection((connectionId: string) => {
      // start listening income message of this connection
      this.wsServerDriver.onMessage(connectionId, (data: string | Uint8Array) => {
        // parse message
        this.parseIncomeMessage(connectionId, data);
      });

      // TODO: on close connection - remove all the listeners
    });
  }

  destroy = async () => {
    await this.wsServerDriver.destroy();
  }


  private parseIncomeMessage(connectionId: string, data: string | Uint8Array) {
    if (!isUint8Array(data)) {
      throw new Error(`Backdoor: data has be a Uint8Array`);
    }
    else if (data.length <= 1) {
      return this.env.log.error(`Backdoor: income data is too small`);
    }

    if (data[0] === BACKDOOR_DATA_TYPES.json) {
      const message: BackdoorMessage = decodeJsonMessage(data as Uint8Array) as any;

      this.resolveJsonMessage(connectionId, message);
    }

    // TODO: update message etc...

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
    if (topic) {
      this.env.events.addListener(category, topic, (data: any) => {
        const returnMessage: EventMessage = { ...message, data };

        return this.send(clientId, returnMessage);
      });
    }
    else {
      this.env.events.addCategoryListener(category, (data: any) => {
        const returnMessage: EventMessage = { ...message, data };

        return this.send(clientId, returnMessage);
      });
    }
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


  private async send(clientId: string, data: any) {
    try {
      await this.wsServerDriver.send(clientId, data);
    }
    catch (err) {
      this.env.log.error(`Backdoor: send error: ${err}`);
    }
  }

}
