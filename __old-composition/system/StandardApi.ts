import {Dictionary, JsonTypes} from '../../../squidlet-lib/src/interfaces/Types';
import {pickObj} from '../../../squidlet-lib/src/objects';
import Context from '../../../../../../../mnt/disk2/workspace/squidlet/__idea2021/src/system/Context.js';
import {StateCategories} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/States.js';
import LogLevel from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/LogLevel.js';
import HostInfo from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/HostInfo.js';
import {calcAllowedLogLevels} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/lib/helpers.js';
import SysIo from '../../../../../../../mnt/disk2/workspace/squidlet-networking/src/interfaces/__old/io/SysIo.js';
import Automation from '../entities/services/Automation/Automation';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/constants.js';
import DeviceBase from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/base/DeviceBase.js';
import {AppType} from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/AppType.js';


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
    // TODO: use just this.context.service
    const automationService: Automation = this.context.system.servicesManager.getService(
      'Automation'
    ) as any;

    automationService.setRuleActive(ruleName, setActive);
  }

  async switchApp(appType: AppType) {
    // if (this.context.config.lockAppSwitch) {
    //   throw new Error(`Switching to app is not allowed in config`);
    // }

    this.context.log.info(`Switching to app type "${appType}"`);

    // write varData/var/startAppType
    await this.context.service.sharedStorage.writeFile(START_APP_TYPE_FILE_NAME, appType);
    // and exit
    this.context.system.ioManager.getIo<SysIo>('Sys').exit()
      // TODO: лучше всетаки использовать await - но там ошибка
      .catch(this.context.log.error);
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

  republishWholeState() {
    // TODO: publish all the states of all the devices etc
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
