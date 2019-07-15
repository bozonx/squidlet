import {JsonTypes} from './interfaces/Types';
import {objGet} from './helpers/lodashLike';
import System from './System';
import {StateCategories} from './interfaces/States';
import {combineTopic} from './helpers/helpers';
import {StateObject} from './State';
import LogLevel from './interfaces/LogLevel';


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

  listenDeviceConfig(deviceId: string, cb: () => void): number {
    // TODO: add
    return 0;
  }

  getDeviceConfig(deviceId: string): StateObject {
    // TODO: add
    return {};
  }

  async setDeviceConfig(deviceId: string, partialState: StateObject): Promise<void> {
    const device = this.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialState);
  }

  getConfig(configParam: string): JsonTypes {
    return objGet(this.system.config, configParam);
  }

  getSessionStore(sessionId: string, key: string): JsonTypes | undefined {
    return this.system.sessions.getStorage(sessionId, key);
  }

  listenLog(logLevel: LogLevel, cb: (msg: string) => void): number {
    // TODO: add
    return 0;
  }

  // blockIo(doBlock: boolean) {
  //   // TODO: add ????
  // }

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
