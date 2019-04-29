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

    switch (channel) {
      case BACKDOOR_CHANNELS.pub:
        return this.onPub(payload);
      case BACKDOOR_CHANNELS.sub:
        return this.onSub(clientId, payload);
      case BACKDOOR_CHANNELS.ioPub:
        return this.onIoPub(payload);
      case BACKDOOR_CHANNELS.ioSub:
        return this.onIoSub(clientId, payload);
      case BACKDOOR_CHANNELS.updatePub:
        return this.onUpdatePub(payload);
      case BACKDOOR_CHANNELS.updateSub:
        return this.onUpdateSub(clientId, payload);
      case BACKDOOR_CHANNELS.logSub:
        return this.onLogSub(clientId, payload);
      case BACKDOOR_CHANNELS.swhitchIoAccess:
        return this.onSwitchIoAccess(payload);
      default:
        this.env.system.log.error(`Backdoor: Can't recognize channel "${channel}"`);
    }

  }

  private onUpdatePub(payload: Uint8Array) {

  }

  private onUpdateSub(clientId: string, payload: Uint8Array) {

  }

  private onPub(payload: Uint8Array) {
    // TODO: convert to json
    // TODO: call events.emit
  }

  private onSub(clientId: string, payload: Uint8Array) {

  }

  private onIoPub(payload: Uint8Array) {
    // TODO: convert to json
  }

  private onIoSub(clientId: string, payload: Uint8Array) {
    // TODO: subscribe to io
  }

  private onLogSub(clientId: string, payload: Uint8Array) {
    // TODO: subscribe to log
  }

  private onSwitchIoAccess(payload: Uint8Array) {
    // TODO: convert to boolean
  }

}
