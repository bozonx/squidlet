import {Dictionary, JsonTypes} from './interfaces/Types';
import {pickObj} from './lib/objects';
import Context from './Context';
import {StateCategories} from './interfaces/States';
import LogLevel from './interfaces/LogLevel';
import HostInfo from './interfaces/HostInfo';
import {calcAllowedLogLevels} from './lib/helpers';
import {LOGGER_EVENT} from './constants';
import SysIo from './interfaces/io/SysIo';
import Automation from '../entities/services/Automation/Automation';


export default class Api {
  private readonly context: Context;


  constructor(context: Context) {
    this.context = context;
  }


  /**
   * The same info for System and for IoServer
   */
  info(): HostInfo {
    return {
      hostType: 'app',
      platform: this.context.config.platform,
      machine: this.context.config.machine,
      usedIo: this.context.system.ioManager.getNames(),
    };
  }

  // getHostConfig(): HostInfo {
  //   return {
  // hostId: this.context.config.id,
  //     // TODO: add used drivers, services, devices and its defenitions
  //     config: this.context.config,
  //   };
  // }

  /**
   * Call device action
   */
  action(deviceId: string, actionName: string, ...args: any[]): Promise<JsonTypes | undefined> {
    const device = this.context.system.devicesManager.getDevice(deviceId);

    this.context.log.info(`Api: called device's "${deviceId}" action: ${actionName} ${JSON.stringify(args)}`);

    return device.action(actionName, ...args);
  }

  // TODO: rename to deviceStatus ???
  getDeviceStatus(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesStatus, deviceId);
  }

  // TODO: rename to deviceConfig ???
  getDeviceConfig(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesConfig, deviceId);
  }

  // TODO: rename to state ???
  getState(category: StateCategories, stateName: string): Dictionary | undefined {
    const result: Dictionary | undefined = this.context.state.getState(category, stateName);

    if (!result) {
      throw new Error(`Can't find the state: category "${category}", stateName: "${stateName}"`);
    }

    return result;
  }

  turnAutomationRule(ruleName: string, turnTo: boolean) {
    // TODO: pass generic instead of "as any"
    const automationService: Automation = this.context.system.servicesManager.getService(
      'Automation'
    ) as any;

    automationService.turnRule(ruleName, turnTo);
  }


  switchToIoServer() {
    if (!this.context.config.ioServer) {
      throw new Error(`Switching to IO-server isn't allowed it config`);
    }

    this.context.log.info(`Switching to IO server`);
    this.context.system.shutdownRequest('switchToIoServer');
  }

  switchToApp() {
    return `Can't switch to app because app is already running`;
  }

  republishWholeState() {
    // TODO: publish all the states of all the devices etc
  }

  async reboot(): Promise<string> {
    const Sys = this.context.system.ioManager.getIo<SysIo>('Sys');

    setTimeout(() => {
      Sys.reboot()
        .catch(this.context.log.error);
    }, this.context.config.config.rebootDelaySec * 1000);

    return `It will be rebooted in ${this.context.config.config.rebootDelaySec} seconds`;
  }


  listenDeviceStatus(
    deviceId: string,
    statusName: string | undefined,
    cb: (changedValues: Dictionary) => void
  ): number {
    const handlerWrapper = (category: number, stateName: string, changedParams: string[]) => {
      if (category !== StateCategories.devicesStatus || stateName !== deviceId) return;

      const changedValues: Dictionary = pickObj(
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

      const changedValues: Dictionary = pickObj(
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

      const changedValues: Dictionary = pickObj(
        this.context.state.getState(category, stateName),
        ...changedParams
      );

      cb(changedValues);
    };

    return this.context.state.onChange(handlerWrapper);
  }

  async setDeviceConfig(deviceId: string, partialState: Dictionary): Promise<void> {
    const device = this.context.system.devicesManager.getDevice(deviceId);

    if (device.setConfig) return device.setConfig(partialState);
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

  /**
   * Remove listeners for state, device status and device config
   */
  removeStateListener(handlerIndex: number) {
    this.context.state.removeListener(handlerIndex);
  }

  removeLogListener(handlerIndex: number) {
    this.context.system.events.removeListener(handlerIndex, LOGGER_EVENT);
  }

}
