import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer
} from '../../drivers/WebSocketServer/WebSocketServer';
import {withoutFirstItemUint8Arr} from '../../../system/helpers/collections';
import {uint8ArrayToJsData} from '../../../system/helpers/binaryHelpers';
import RemoteCallMessage from '../../../system/interfaces/RemoteCallMessage';


enum BACKDOOR_CHANNELS {
  pub,
  sub,
  // updatePub,
  // updateSub,
  // ioPub,
  // ioSub,
  // logSub,
  // switchIoAccess,
}

export enum BACKDOOR_DATA_TYPES {
  json,
}

const CHANNEL_POSITION = 0;

export type BackdoorMessageTypes = 'emit' | 'addListener' | 'removeListener' | 'subscribe';

export interface BackdoorMessage {
  type: BackdoorMessageTypes;
  payload: {
    category: string;
    topic?: string;
    data?: string;
  };
}

interface EventMessage {
  category: string;
  topic?: string;
  data?: any;
}

interface BackDoorProps {
  host: string;
  port: number;
}

// TODO: set default host port in manifest
// TODO: listen subscribes which was set by squildetctl - use externalDataOutcome, externalDataIncome

export default class Backdoor extends ServiceBase<BackDoorProps> {
  private get wsServerDriver(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance({
        // TODO: collect defaults !!!
        ...this.props,
        binary: true,
      });

    this.wsServerDriver.onConnection((clientId: string) => {
      // start listening income message of this connection
      this.wsServerDriver.onIncomeMessage(clientId, (message: Uint8Array | {[index: string]: any} ) => {
        // parse message
        this.parseIncomeMessage(clientId, message as Uint8Array);
      });
    });
  }


  private parseIncomeMessage(clientId: string, message: Uint8Array) {
    if (message.length <= 1) {
      return this.env.log.error(`Backdoor: message is too small`);
    }

    const channel: number = message[CHANNEL_POSITION];
    const payload: Uint8Array = withoutFirstItemUint8Arr(message);

    switch (channel) {
      case BACKDOOR_CHANNELS.pub:
        return this.onPub(payload);
      case BACKDOOR_CHANNELS.sub:
        return this.onSub(clientId, payload);

        // TODO: может не выделять - а просто обращаться к событиям напрямую ???
      // case BACKDOOR_CHANNELS.ioPub:
      //   return this.onIoPub(payload);
      // case BACKDOOR_CHANNELS.ioSub:
      //   return this.onIoSub(clientId, payload);
      // case BACKDOOR_CHANNELS.logSub:
      //   return this.onLogSub(clientId, payload);
      // case BACKDOOR_CHANNELS.switchIoAccess:
      //   return this.onSwitchIoAccess(payload);
      // case BACKDOOR_CHANNELS.updatePub:
      //   return this.onUpdatePub(payload);
      // case BACKDOOR_CHANNELS.updateSub:
      //   return this.onUpdateSub(clientId, payload);

      default:
        this.env.log.error(`Backdoor: Can't recognize channel "${channel}"`);
    }

  }


  private onPub(payload: Uint8Array) {
    const message: EventMessage = uint8ArrayToJsData(payload);

    if (!message.topic) {
      return this.env.log.error(`Backdoor: message doesn't have a topic "${JSON.stringify(message)}"`);
    }

    this.env.events.emit(message.category, message.topic, message.data);
  }

  private onSub(clientId: string, payload: Uint8Array) {
    const message: EventMessage = uint8ArrayToJsData(payload);

    if (message.topic) {
      this.env.events.addListener(message.category, message.topic, (data: any) => {
        const returnMessage: EventMessage = { ...message, data };

        return this.send(clientId, returnMessage);
      });
    }
    else {
      this.env.events.addCategoryListener(message.category, (data: any) => {
        const returnMessage: EventMessage = { ...message, data };

        return this.send(clientId, returnMessage);
      });
    }
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
