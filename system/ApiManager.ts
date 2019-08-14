import Context from './Context';
import IndexedEvents from './lib/IndexedEvents';
import RemoteCall from './lib/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {makeUniqId} from './lib/uniqId';


export type RcOutcomeHandler = (sessionId: string, message: RemoteCallMessage) => void;


/**
 * RemoteCall Api for acting remotely via ws or mqtt or others services.
 */
export default class ApiManager {
  private readonly context: Context;
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  private remoteCalls: {[index: string]: RemoteCall} = {};


  constructor(context: Context) {
    this.context = context;
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
      this.makeNewSession(sessionId);
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


  private async callApi(methodName: string, args: any[]): Promise<any> {
    return (this.context.system.api as any)[methodName](...args);
  }

  private makeNewSession(sessionId: string) {
    this.remoteCalls[sessionId] = new RemoteCall(
      // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
      async (message: RemoteCallMessage) => this.rcOutcomeEvents.emit(sessionId, message),
      this.callApi,
      this.context.config.config.ioSetResponseTimoutSec,
      this.context.log.error,
      makeUniqId
    );
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
//     // T-O-D-O: add other types
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
