import System from './System';
import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import RemoteCall from './helpers/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {objGet} from './helpers/lodashLike';


type PublishHandler = (topic: string, data: JsonTypes, isRepeat?: boolean) => void;
export type RcOutcomeHandler = (message: RemoteCallMessage) => void;


/**
 * Api for acting remotely via ws or mqtt or others.
 * Types of topics:
 * * Calling device action:
 *   * device.room.deviceId/myAction value
 *   * room.deviceId/myAction value
 *
 * RemoteCall api:
 * * Call device's action - ('deviceAction', 'room.deviceId', 'turn', 'param1', 'param2')
 * * Listen to device's status - ('listenDeviceStatus', 'room.deviceId', 'temperature')
 * *            default status - ('listenDeviceStatus', 'room.deviceId')
 * * Listen to device's config - ('listenDeviceConfig', 'room.deviceId')
 * * Set device config - ('setDeviceConfig', 'room.deviceId', {... partial config})
 * * Getting config param - ('getConfig', 'config.ioSetResponseTimoutSec')
 * * Getting session store - ('getSessionStore', 'mySessionId', 'key')
 * * Get io names list - ('getIoNames')
 *
 * * Getting state
 * * Subscribe to state change
 * * Initiate updating
 * * Switch automation
 */
export default class Api {
  private readonly system: System;
  private readonly publishEvents = new IndexedEvents<PublishHandler>();
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  // TODO: создавать инстанс на каждую сессию
  //private readonly remoteCall: RemoteCall;
  private remoteCalls: {[index: string]: RemoteCall} = {};
  private readonly _ioSet?: IoSetServer;
  private get ioSet(): IoSetServer {
    return this._ioSet as IoSetServer;
  }


  constructor(system: System) {
    this.system = system;
    this.remoteCall = new RemoteCall(
      // TODO: как бы сделать чтобы промис всетаки выполнялся когда сообщение доставленно клиенту
      async (message: RemoteCallMessage) => this.rcOutcomeEvents.emit(message),
      this.callApi,
      this.system.config.config.ioSetResponseTimoutSec,
      this.system.log.error,
      this.system.generateUniqId
    );

    this._ioSet = this.system.servicesManager.getService<IoSetServer>('IoSetServer');
  }

  destroy() {
    this.publishEvents.removeAll();

    for (let sessionId of Object.keys(this.remoteCalls)) {
      await this.remoteCalls[sessionId].destroy();
    }

    this.remoteCalls = {};
  }


  /**
   * Call this method if session has just been closed
   */
  async sessionClosed(sessionId: string) {
    await this.remoteCalls[sessionId].destroy();
    delete this.remoteCalls[sessionId];
  }

  /**
   * Call it when you received income data of remoteCall channel
   */
  incomeRemoteCall(sessionId: string, message: RemoteCallMessage): Promise<void> {
    if (!this.remoteCalls[sessionId]) {
      this.remoteCalls[sessionId] = new RemoteCall(
        (message: RemoteCallMessage) => this.sendEvents.emit(sessionId, message),
        this.callIoMethod,
        this.env.system.config.config.ioSetResponseTimoutSec,
        this.env.log.error,
        this.env.system.generateUniqId
      );
    }

    return this.remoteCalls[sessionId].incomeMessage(rawRemoteCallMessage);

    return this.remoteCall.incomeMessage(message);
  }

  /**
   * Listen it to send remoteCall message to other side
   */
  onOutcomeRemoteCall(cb: RcOutcomeHandler) {
    this.rcOutcomeEvents.addListener(cb);
  }

  /**
   * Call this method if you want to send outcome data. (E.g after device state is changed)
   */
  publish(topic: string, data: any, isRepeat?: boolean) {
    return this.publishEvents.emit(topic, data, isRepeat);
  }

  /**
   * Listen to outcome requests. E.g devices sends their status or config to remote host.
   */
  onPublish(cb: PublishHandler): number {
    return this.publishEvents.addListener(cb);
  }

  /**
   * Call device's action and receive a result
   */
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }


  private async callApi(pathToMethod: string, args: any[]): Promise<any> {
    switch (pathToMethod) {
      case 'deviceAction':
        return this.callDeviceAction(args[0], args[1], ...args.slice(2));
      case 'listenDeviceStatus':
        // TODO: use this.publishEvents
        // TODO: !!! ('listenDeviceStatus', 'room.deviceId', 'temperature')
      case 'listenDeviceConfig':
        // TODO: use this.publishEvents
        // TODO: !!! ('listenDeviceConfig', 'room.deviceId')
      case 'setDeviceConfig':
        // TODO: !!! ('setDeviceConfig', 'room.deviceId', {... partial config})
      case 'getConfig':
        return objGet(this.system.config, args[0]);
      case 'getSessionStore':
        return this.system.sessions.getStorage(args[0], args[1]);
      case 'getIoNames':
        return this.system.ioManager.getNames();
      default:
    }

    // TODO: add other types
    // TODO: add get io Names
    // Getting state
    // Subscribe to state change
    // Initiate updating
    // Switch automation
  }

  private callIoMethod = (pathToMethod: string, ...args: any[]): Promise<any> => {
    const [ioName, methodName] = pathToMethod.split('.');

    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.ioManager.getIo(ioName);

    return IoItem[methodName](...args);
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
