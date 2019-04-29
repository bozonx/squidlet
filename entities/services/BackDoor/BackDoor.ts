import ServiceBase from 'system/baseServices/ServiceBase';
import {GetDriverDep} from 'system/entities/EntityBase';
import categories from 'system/dict/categories';
import {
  WebSocketServer,
  WebSocketServerConnection
} from '../../drivers/WebSocketServer/WebSocketServer';
import {withoutFirstItemUint8Arr} from '../../../system/helpers/collections';


enum BACKDOOR_CHANNELS {
  pub,
  sub,
  ioPub,
  ioSub,
  updatePub,
  updateSub,
  logSub,
  swhitchIoAccess,
}

const CHANNEL_POSITION = 0;

interface BackDoorProps {
  host: string;
  port: number;
}

// TODO: set default host port in manifest
// TODO: listen subscribes which was set by squildetctl - use externalDataOutcome, externalDataIncome

export default class BackDoor extends ServiceBase<BackDoorProps> {
  private get wsServerDriver(): WebSocketServer {
    return this.depsInstances.wsServerDriver as any;
  }


  protected willInit = async (getDriverDep: GetDriverDep) => {
    this.depsInstances.wsServerDriver = await getDriverDep('WebSocketServer')
      .getInstance({
        ...this.props,
        binary: true,
      });

    this.wsServerDriver.onConnection((connection: WebSocketServerConnection) => {
      connection.onIncomeMessage((message: {[index: string]: any}) => {
        this.onIncomeMessage(connection.clientId, message as Uint8Array);
      });
    });

    this.listenSystemEvents();
  }


  private listenSystemEvents() {
    // TODO: слушать только если пришел запрос

    this.env.events.addCategoryListener(categories.logger, (data: any, level: string) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.updater, (data: any, topic: string) => {
      // TODO: !!!
    });

    this.env.events.addCategoryListener(categories.ioSet, (data: any) => {
      //const instance: IoItem = this.env.system.ioSet.getInstance(ioName);

      // TODO: это выход из ioSet - его перенаправляем на удаленный хост если он подписан

    });
  }

  private onIncomeMessage(clientId: string, message: Uint8Array) {
    if (message.length <= 1) {
      return this.env.system.log.error(`Backdoor: message is too small`);
    }

    const channel: number = message[CHANNEL_POSITION];
    const payload: Uint8Array = withoutFirstItemUint8Arr(message);

    if (channel === BACKDOOR_CHANNELS.pub) {
      this.onPub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.sub) {
      this.onSub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.ioPub) {
      this.onIoPub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.ioSub) {
      this.onIoSub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.updatePub) {
      this.onUpdatePub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.updateSub) {
      this.onUpdateSub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.logSub) {
      this.onLogSub(payload);
    }
    else if (channel === BACKDOOR_CHANNELS.swhitchIoAccess) {
      this.onSwitchIoAccess(payload);
    }
    else {
      this.env.system.log.error(`Backdoor: Can't recognize channel "${channel}"`);
    }
  }

  private onUpdatePub(payload: Uint8Array) {

  }

  private onUpdateSub(payload: Uint8Array) {

  }

  private onPub(payload: Uint8Array) {
    // TODO: convert to json
    // TODO: call events.emit
  }

  private onSub(payload: Uint8Array) {

  }

  private onIoPub(payload: Uint8Array) {
    // TODO: convert to json
  }

  private onIoSub(payload: Uint8Array) {
    // TODO: subscribe to io
  }

  private onLogSub(payload: Uint8Array) {
    // TODO: subscribe to log
  }

  private onSwitchIoAccess(payload: Uint8Array) {
    // TODO: convert to boolean
  }

}
