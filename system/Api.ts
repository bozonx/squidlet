import System from './System';
import {JsonTypes} from './interfaces/Types';
import IndexedEvents from './helpers/IndexedEvents';
import RemoteCall from './helpers/remoteCall/RemoteCall';
import RemoteCallMessage from './interfaces/RemoteCallMessage';
import {objGet} from './helpers/lodashLike';
import {Data} from './baseDevice/DeviceDataManagerBase';
import {StateCategories} from './interfaces/States';
import {combineTopic} from './helpers/helpers';


//type PublishHandler = (topic: string, data: JsonTypes, isRepeat?: boolean) => void;
export type RcOutcomeHandler = (sessionId: string, message: RemoteCallMessage) => void;


/**
 * Api for acting remotely via ws or mqtt or others.
 * Types of topics:
 * * Calling device action:
 *   * device.room.deviceId/myAction value
 *   * room.deviceId/myAction value
 *
 * RemoteCall api:
 * * Call device's action - ('deviceAction', 'room.deviceId', 'turn', 'param1', 'param2')
 * * Listen to device's status change - ('listenDeviceStatus', 'room.deviceId', stateName, cb: (changedParams) => void)
 * * Listen to device's config change - ('listenDeviceConfig', 'room.deviceId', cb: () => void)
 * * Set device config - ('setDeviceConfig', 'room.deviceId', {... partial config})
 * * Getting config param - ('getConfig', 'config.ioSetResponseTimoutSec')
 * * Getting session store - ('getSessionStore', 'mySessionId', 'key')
 * * Listen log - ('listenLog', 'info', yourCallback)
 * * blockIo - ('blockIo', true)
 * * Get io names list - ('getIoNames')
 * * Call io method - ('callIoMethod', 'ioName', 'methodName', ...methodArguments)
 *
 * * Getting state
 * * Subscribe to state change
 * * Initiate updating
 * * Switch automation
 */
export default class Api {
  private readonly system: System;
  //private readonly publishEvents = new IndexedEvents<PublishHandler>();
  private readonly rcOutcomeEvents = new IndexedEvents<RcOutcomeHandler>();
  private remoteCalls: {[index: string]: RemoteCall} = {};


  constructor(system: System) {
    this.system = system;
  }

  async destroy() {
    //this.publishEvents.removeAll();
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

  // TODO: может перенести в другое место DeviceManager или State??? ????
  // /**
  //  * Call this method if you want to send outcome data. (E.g after device state is changed)
  //  */
  // publish(topic: string, data: any, isRepeat?: boolean) {
  //   return this.publishEvents.emit(topic, data, isRepeat);
  // }
  //
  // /**
  //  * Listen to outcome requests. E.g devices sends their status or config to remote host.
  //  */
  // onPublish(cb: PublishHandler): number {
  //   return this.publishEvents.addListener(cb);
  // }

  // TODO: может перенести в другое место
  /**
   * Call device's action and receive a result
   */
  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }

  // TODO: может перенести в другое место
  async sedDeviceConfig(deviceId: string, partialData: Data): Promise<void> {
    const device = this.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialData);
  }


  private async callApi(pathToMethod: string, args: any[]): Promise<any> {
    switch (pathToMethod) {
      case 'deviceAction':
        return this.callDeviceAction(args[0], args[1], ...args.slice(2));
      case 'listenDeviceStatus':
        return this.listenDeviceStatus(args[0], args[1], args[2]);
      case 'listenDeviceConfig':
        // TODO: add
      case 'setDeviceConfig':
        return this.sedDeviceConfig(args[0], args[1]);
      case 'getConfig':
        return objGet(this.system.config, args[0]);
      case 'getSessionStore':
        return this.system.sessions.getStorage(args[0], args[1]);
      case 'listenLog':
        // TODO: add
        //return this.system.sessions.getStorage(args[0], args[1]);
      case 'blockIo':
        // TODO: add
      case 'getIoNames':
        return this.system.ioManager.getNames();
      case 'callIoMethod':
        return this.callIoMethod(args[0], args[1], ...args.slice(2));
      default:
        throw new Error(`Api.callApi: Unknown method`);
    }

    // TODO: add other types
    // Getting state
    // Subscribe to state change
    // Initiate updating
    // Switch automation
  }

  private callIoMethod = (ioName: string, methodName: string, ...args: any[]): Promise<any> => {
    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.system.ioManager.getIo(ioName);

    return IoItem[methodName](...args);
  }

  private listenDeviceStatus(deviceId: string, statusName: string | undefined, cb: (changedParams: string[]) => void): number {
    // TODO: как потом убить хэндлеры ???
    // TODO: а можно ли слушать отдельный статус ???? temperature ???

    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      const topic = combineTopic(this.system.systemConfig.topicSeparator, deviceId, statusName);

      if (category !== StateCategories.devicesStatus || stateName !== topic) return;

      cb(changedParams);
    };

    return this.system.state.onChange(handlerWrapper);
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
