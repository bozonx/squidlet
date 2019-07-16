import {JsonTypes} from './interfaces/Types';
import {objGet, pick} from './helpers/lodashLike';
import System from './System';
import {StateCategories} from './interfaces/States';
import {StateObject} from './State';
import LogLevel from './interfaces/LogLevel';
import HostConfig from './interfaces/HostConfig';
import HostInfo from './interfaces/HostInfo';


export default class Api {
  private readonly system: System;


  constructor(system: System) {
    this.system = system;
  }


  callDeviceAction(deviceId: string, actionName: string, ...params: any[]): Promise<JsonTypes> {
    const device = this.system.devicesManager.getDevice(deviceId);

    return device.action(actionName, ...params);
  }

  listenDeviceStatus(
    deviceId: string,
    statusName: string | undefined,
    cb: (changedValues: StateObject) => void
  ): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesStatus || stateName !== deviceId) return;

      const changedValues: StateObject = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  listenDeviceConfig(deviceId: string, cb: (changedValues: StateObject) => void): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesConfig || stateName !== deviceId) return;

      const changedValues: StateObject = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  listenState(category: StateCategories, stateName: string, cb: (changedValues: StateObject) => void): number {
    const handlerWrapper = (currentCategory: number, currentStateName: string, changedParams: string[]) => {
      if (category !== currentCategory || stateName !== currentStateName) return;

      const changedValues: StateObject = pick(
        this.system.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.system.state.onChange(handlerWrapper);
  }

  getDeviceStatus(deviceId: string): Promise<StateObject> {
    // TODO: add
    return {};
  }

  getDeviceConfig(deviceId: string): Promise<StateObject> {
    // TODO: add
    return {};
  }

  async setDeviceConfig(deviceId: string, partialState: StateObject): Promise<void> {
    const device = this.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialState);
  }

  getState(category: StateCategories, stateName: string): Promise<StateObject> {
    // TODO: add
    return {};
  }

  getHostConfig(): HostConfig {
    return this.system.config;
  }

  // TODO: is it really need???
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

  listenLog(logLevel: LogLevel, cb: (msg: string) => void): number {
    // TODO: add
    return 0;
  }

  // blockIo(doBlock: boolean) {
  //   // TODO: add ????
  // }

  getIoNames() {
    // TODO: не нужно наверное - можно использовать getHostInfo ????
    return this.system.ioManager.getNames();
  }

  callIoMethod = async (ioName: string, methodName: string, ...args: any[]): Promise<any> => {
    const IoItem: {[index: string]: (...args: any[]) => Promise<any>} = this.system.ioManager.getIo(ioName);

    return IoItem[methodName](...args);
  }

}
