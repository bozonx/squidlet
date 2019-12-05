import {Dictionary, JsonTypes} from './interfaces/Types';
import {pickObj} from './lib/objects';
import Context from './Context';
import {StateCategories} from './interfaces/States';
import LogLevel from './interfaces/LogLevel';
import HostInfo from './interfaces/HostInfo';
import {calcAllowedLogLevels} from './lib/helpers';
import SysIo from './interfaces/io/SysIo';
import Automation from '../entities/services/Automation/Automation';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from './constants';
import DeviceBase from './base/DeviceBase';
import StorageIo from './interfaces/io/StorageIo';
import {pathJoin} from './lib/paths';
import systemConfig from './systemConfig';
import {AppType} from './interfaces/AppType';


export default class StandardApi {
  private readonly context: Context;


  constructor(context: Context) {
    this.context = context;
  }


  /**
   * The same info for System and for IoServer
   */
  info(): HostInfo {
    return {
      appType: this.context.config.appType,
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
  action(deviceId: string, actionName: string, ...args: any[]): Promise<JsonTypes | void> {
    const device: DeviceBase = this.context.system.devicesManager.getDevice(deviceId);

    this.context.log.info(`Api: called device's "${deviceId}" action: ${actionName} ${JSON.stringify(args)}`);

    return device.action(actionName, ...args);
  }

  // Get whole device status or undefined if there no such device or device doesn't have a status
  getDeviceStatus(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesStatus, deviceId);
  }

  // get while device config or undefined if there no such device or device doesn't have a config
  getDeviceConfig(deviceId: string): Dictionary | undefined {
    return this.context.state.getState(StateCategories.devicesConfig, deviceId);
  }

  getState(category: StateCategories, stateName: string): Dictionary | undefined {
    const result: Dictionary | undefined = this.context.state.getState(category, stateName);

    if (!result) {
      throw new Error(`Can't find the state: category "${category}", stateName: "${stateName}"`);
    }

    return result;
  }

  getAutomationRuleActiveState(ruleName: string) {
    // TODO: pass generic instead of "as any"
    const automationService: Automation = this.context.system.servicesManager.getService(
      'Automation'
    ) as any;

    return automationService.getRuleActiveState(ruleName);
  }

  setAutomationRuleActive(ruleName: string, setActive: boolean) {
    // TODO: pass generic instead of "as any"
    const automationService: Automation = this.context.system.servicesManager.getService(
      'Automation'
    ) as any;

    automationService.setRuleActive(ruleName, setActive);
  }


  async switchToIoServer() {
    if (this.context.config.lockAppSwitch) {
      throw new Error(`Switching to IO-server isn't allowed it config`);
    }

    if (!this.context.config.ioServer) {
      throw new Error(`IoServer params aren't set int the host config`);
    }

    this.context.log.info(`Switching to IO server`);

    const storageIo: StorageIo = await this.context.system.ioManager.getIo<StorageIo>('Storage');
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.tmp,
      START_APP_TYPE_FILE_NAME,
    );
    const ioServerAppType: AppType = 'ioServer';

    await storageIo.writeFile(startAppTypeFileName, ioServerAppType);

    this.context.system.ioManager.getIo<SysIo>('Sys').exit();
  }

  switchToApp() {
    return `Can't switch to app because app is already running`;
  }

  republishWholeState() {
    // TODO: publish all the states of all the devices etc
  }

  async exit(code: number = 0): Promise<string> {
    const Sys = this.context.system.ioManager.getIo<SysIo>('Sys');

    setTimeout(() => {
      Sys.exit(code)
        .catch(this.context.log.error);
    }, this.context.config.config.rebootDelaySec * 1000);

    return `It will be exited in ${this.context.config.config.rebootDelaySec} seconds`;
  }

  async reboot(): Promise<string> {
    const Sys = this.context.system.ioManager.getIo<SysIo>('Sys');

    setTimeout(() => {
      Sys.reboot()
        .catch(this.context.log.error);
    }, this.context.config.config.rebootDelaySec * 1000);

    return `It will be rebooted in ${this.context.config.config.rebootDelaySec} seconds`;
  }


  /**
   * Listen device status and make object with changed params
   */
  listenDeviceStatus(deviceId: string, cb: (changedParams: Dictionary) => void): number {
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

  /**
   * Listen device config and make object with changed params
   */
  listenDeviceConfig(deviceId: string, cb: (changedParams: Dictionary) => void): number {
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

    return this.context.system.events.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
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
    this.context.system.events.removeListener(handlerIndex, SystemEvents.logger);
  }

}
