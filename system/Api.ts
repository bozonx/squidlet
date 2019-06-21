import {JsonTypes} from './interfaces/Types';
import {objGet} from './helpers/lodashLike';
import System from './System';
import {Data} from './baseDevice/DeviceDataManagerBase';
import {StateCategories} from './interfaces/States';
import {combineTopic} from './helpers/helpers';
import {STATE_SEPARATOR} from './State';


/**
 *
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


  constructor(system: System) {
    this.system = system;
  }


  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }

  listenDeviceStatus(deviceId: string, statusName: string | undefined, cb: (changedParams: string[]) => void): number {
    // TODO: как потом убить хэндлеры ???

    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesStatus || stateName.indexOf(deviceId) !== 0) return;

      // TODO: наверное будет ещё указан status или config
      const topic = combineTopic(STATE_SEPARATOR, deviceId, statusName);

      if (stateName !== topic) return;

      cb(changedParams);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  listenDeviceConfig() {
    // TODO: add
  }

  async setDeviceConfig(deviceId: string, partialData: Data): Promise<void> {
    const device = this.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialData);
  }

  getConfig() {
    return objGet(this.system.config, args[0]);
  }

  getSessionStore() {
    return this.system.sessions.getStorage(args[0], args[1]);
  }

  listenLog() {
    // TODO: add
  }

  blockIo() {
    // TODO: add
  }

  getIoNames() {
    return this.system.ioManager.getNames();
  }

  callIoMethod = async (ioName: string, methodName: string, ...args: any[]): Promise<any> => {
    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.system.ioManager.getIo(ioName);

    return IoItem[methodName](...args);
  }


  // TODO: add other types
  // Getting state
  // Subscribe to state change
  // Initiate updating
  // Switch automation
}
