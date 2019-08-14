import {Dictionary, JsonTypes} from './interfaces/Types';
import {objGet, pick} from './lib/lodashLike';
import Context from './Context';
import {StateCategories} from './interfaces/States';
import LogLevel from './interfaces/LogLevel';
import HostConfig from './interfaces/HostConfig';
import HostInfo from './interfaces/HostInfo';
import {calcAllowedLogLevels} from './lib/helpers';
import {LOGGER_EVENT} from './constants';


export default class Api {
  private readonly context: Context;


  constructor(context: Context) {
    this.context = context;
  }


  callDeviceAction(deviceId: string, actionName: string, ...args: any[]): Promise<JsonTypes> {
    const device = this.context.system.devicesManager.getDevice(deviceId);

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
        this.context.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.context.state.onChange(handlerWrapper);
  }

  listenDeviceConfig(deviceId: string, cb: (changedValues: Dictionary) => void): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesConfig || stateName !== deviceId) return;

      const changedValues: Dictionary = pick(
        this.context.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.context.state.onChange(handlerWrapper);
  }

  listenState(category: StateCategories, stateName: string, cb: (changedValues: Dictionary) => void): number {
    const handlerWrapper = (currentCategory: number, currentStateName: string, changedParams: string[]) => {
      if (category !== currentCategory || stateName !== currentStateName) return;

      const changedValues: Dictionary = pick(
        this.context.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.context.state.onChange(handlerWrapper);
  }

  getDeviceStatus(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesStatus, deviceId);
  }

  getDeviceConfig(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesConfig, deviceId);
  }

  async setDeviceConfig(deviceId: string, partialState: Dictionary): Promise<void> {
    const device = this.context.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialState);
  }

  getState(category: StateCategories, stateName: string): Dictionary | undefined {
    return this.context.state.getState(category, stateName);
  }

  getHostConfig(): HostConfig {
    return this.context.config;
  }

  getHostConfigValue(configParam: string): JsonTypes {
    return objGet(this.context.config, configParam);
  }

  getHostInfo(): HostInfo {
    return {
      usedIo: this.context.system.ioManager.getNames(),
    };
  }

  getSessionStore(sessionId: string, key: string): JsonTypes | undefined {
    return this.context.sessions.getStorage(sessionId, key);
  }

  listenLog(logLevel: LogLevel = 'info', cb: (msg: string) => void): number {
    const allowedLogLevels: LogLevel[] = calcAllowedLogLevels(logLevel);

    return this.context.system.events.addListener(LOGGER_EVENT, (message: string, level: LogLevel) => {
      if (allowedLogLevels.includes(level)) cb(message);
    });
  }

  switchToIoServer() {
    // TODO: !!!!
    // TODO: запретить в dev режиме и если стоит параметр конфига
    // TODO: либо в dev режиме жестко указывать параметр конфига
  }

  /**
   * Remove listeners for state, device status and device config
   */
  removeStateListener(handlerIndex: number) {
    this.context.state.removeListener(handlerIndex);
  }

  removeLogListener(handlerIndex: number) {
    this.context.system.events.removeListener(LOGGER_EVENT, handlerIndex);
  }

}
