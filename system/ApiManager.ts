import System from './System';
import IndexedEvents from './helpers/IndexedEvents';
import RemoteCall from './helpers/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';


export type RcOutcomeHandler = (sessionId: string, message: RemoteCallMessage) => void;


/**
 * Api for acting remotely via ws or mqtt or others.
 */
export default class ApiManager {
  private readonly system: System;
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  private remoteCalls: {[index: string]: RemoteCall} = {};


  constructor(system: System) {
    this.system = system;
  }

  async destroy() {
    this.rcOutcomeEvents.removeAll();

    for (let sessionId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[sessionId].destroy();
    }

    delete this.remoteCalls;
  }


  /**
   * Call it when you received income data of remoteCall channel
   */
  incomeRemoteCall(sessionId: string, message: RemoteCallMessage): Promise<void> {
    if (!this.remoteCalls[sessionId]) {
      this.remoteCalls[sessionId] = new RemoteCall(
        // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
        async (message: RemoteCallMessage) => this.rcOutcomeEvents.emit(sessionId, message),
        this.callApi,
        this.system.config.config.ioSetResponseTimoutSec,
        this.system.log.error,
        this.system.generateUniqId
      );
    }

    return this.remoteCalls[sessionId].incomeMessage(message);
  }

  /**
   * Listen it to send remoteCall message to other side
   */
  onOutcomeRemoteCall(cb: RcOutcomeHandler) {
    this.rcOutcomeEvents.addListener(cb);
  }

  /**
   * Call this method if session has just been closed
   */
  async remoteCallSessionClosed(sessionId: string) {
    await this.remoteCalls[sessionId].destroy();
    delete this.remoteCalls[sessionId];
  }


  private async callApi(pathToMethod: string, args: any[]): Promise<any> {
    // TODO: call api

    // switch (pathToMethod) {
    //   case 'deviceAction':
    //     return this.callDeviceAction(args[0], args[1], ...args.slice(2));
    //   case 'listenDeviceStatus':
    //     return this.listenDeviceStatus(args[0], args[1], args[2]);
    //   case 'listenDeviceConfig':
    //     // TODO: add
    //   case 'setDeviceConfig':
    //     return this.sedDeviceConfig(args[0], args[1]);
    //   case 'getConfig':
    //     return objGet(this.system.config, args[0]);
    //   case 'getSessionStore':
    //     return this.system.sessions.getStorage(args[0], args[1]);
    //   case 'listenLog':
    //     // TODO: add
    //     //return this.system.sessions.getStorage(args[0], args[1]);
    //   case 'blockIo':
    //     // TODO: add
    //   case 'getIoNames':
    //     return this.system.ioManager.getNames();
    //   case 'callIoMethod':
    //     return this.callIoMethod(args[0], args[1], ...args.slice(2));
    //   default:
    //     throw new Error(`Api.callApi: Unknown method`);
    // }
  }

}



// /**
//  * Call this method if external income request is received (e.g from remote host by mqtt or ws)
//  */
// async income(topic: string, data?: string | Uint8Array) {
//   this.system.log.info(`Api income: ${topic} - ${JSON.stringify(data)}`);
//
//   const msg: ApiMessage = this.parseMessage(topic, data);
//
//   switch (msg.type) {
//     case 'deviceIncome':
//       const payload = msg.payload as DeviceIncomePayload;
//
//       return this.callDeviceAction(payload.deviceId, payload.action, ...payload.params);
//
//     // TODO: add other types
//
//     default:
//       return this.system.log.error(`Api.income: Unsupported message type "${msg.type}"`);
//   }
// }

// /**
//  * Get object like {deviceId: [actionName, ...]}
//  */
// getDevicesActions(): {[index: string]: string[]} {
//   // T-O-D-O: может перенсти в helpers ???
//   const result: {[index: string]: string[]} = {};
//   const devicesIds: string[] = this.system.devicesManager.getInstantiatedDevicesIds();
//
//   for (let devicesId of devicesIds) {
//     const device = this.system.devicesManager.getDevice(devicesId);
//
//     if (isEmpty((device as any).actions)) continue;
//
//     result[devicesId] = Object.keys((device as any).actions);
//   }
//
//   return result;
// }
