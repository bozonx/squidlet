import {Dictionary, JsonTypes} from './interfaces/Types';
import {objGet, pick} from './lib/lodashLike';
import System from './System';
import {StateCategories} from './interfaces/States';
import LogLevel from './interfaces/LogLevel';
import HostConfig from './interfaces/HostConfig';
import HostInfo from './interfaces/HostInfo';
import {LOGGER_EVENT} from './dict/systemEvents';
import {calcAllowedLogLevels} from './lib/helpers';


export default class Api {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  callDeviceAction(deviceId: string, actionName: string, ...args: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...args);
  }

  listenDeviceStatus(
    deviceId: string,
    statusName: string | undefined,
    cb: (changedValues: Dictionary) => void
  ): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesStatus || stateName !== deviceId) return;

      const changedValues: Dictionary = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  listenDeviceConfig(deviceId: string, cb: (changedValues: Dictionary) => void): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesConfig || stateName !== deviceId) return;

      const changedValues: Dictionary = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  listenState(category: StateCategories, stateName: string, cb: (changedValues: Dictionary) => void): number {
    const handlerWrapper = (currentCategory: number, currentStateName: string, changedParams: string[]) => {
      if (category !== currentCategory || stateName !== currentStateName) return;

      const changedValues: Dictionary = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  getDeviceStatus(deviceId: string): Dictionary | undefined {
    return this.system.state.getState(StateCategories.devicesStatus, deviceId);
  }

  getDeviceConfig(deviceId: string): Dictionary | undefined {
    return this.system.state.getState(StateCategories.devicesConfig, deviceId);
  }

  async setDeviceConfig(deviceId: string, partialState: Dictionary): Promise<void> {
    const device = this.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialState);
  }

  getState(category: StateCategories, stateName: string): Dictionary | undefined {
    return this.system.state.getState(category, stateName);
  }

  getHostConfig(): HostConfig {
    return this.system.config;
  }

  getSystemConfigParam(configParam: string): JsonTypes {
    return objGet(this.system.config, configParam);
  }

  getHostInfo(): HostInfo {
    return {
      usedIo: this.system.ioManager.getNames(),
    };
  }

  getSessionStore(sessionId: string, key: string): JsonTypes | undefined {
    return this.system.sessions.getStorage(sessionId, key);
  }

  listenLog(logLevel: LogLevel = 'info', cb: (msg: string) => void): number {
    const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(logLevel);

    return this.system.events.addListener(LOGGER_EVENT, (message: string, level: LogLevel) => {
      if (allowedLogLevels.includes(level)) cb(message);
    });
  }

}


// callIoMethod = async (ioName: string, methodName: string, ...args: any[]): Promise<any> => {
//   const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.system.ioManager.getIo(ioName);
//
//   return IoItem[methodName](...args);
// }

// blockIo(doBlock: boolean) {
// }

// getIoNames() {
//   return this.system.ioManager.getNames();
// }
