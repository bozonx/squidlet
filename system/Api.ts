import {Dictionary, JsonTypes} from './interfaces/Types';
import {pick} from './lib/lodashLike';
import Context from './Context';
import {StateCategories} from './interfaces/States';
import LogLevel from './interfaces/LogLevel';
import HostInfo from './interfaces/HostInfo';
import {calcAllowedLogLevels} from './lib/helpers';
import {IO_SERVER_MODE_FILE_NAME, LOGGER_EVENT} from './constants';
import SysIo from './interfaces/io/SysIo';
import StorageIo from './interfaces/io/StorageIo';
import {pathJoin} from './lib/nodeLike';


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

  getHostInfo(): HostInfo {
    return {
      usedIo: this.context.system.ioManager.getNames(),
      config: this.context.config,
      systemConfig: this.context.systemConfig,
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

  async switchToIoServer() {
    if (this.context.config.ioServer === null) {
      throw new Error(`Switching to IO-server isn't allowed it config`);
    }

    const pathToTmpFile = pathJoin(
      this.context.systemConfig.rootDirs.tmp,
      IO_SERVER_MODE_FILE_NAME
    );
    const storage = this.context.getIo<StorageIo>('Storage');
    const sys = this.context.getIo<SysIo>('Sys');

    this.context.log.info(`Switching to IO server mode`);

    // TODO: ошика с путями
    //await storage.writeFile(pathToTmpFile, '1');
    await sys.restart();
  }

  async reboot() {
    const Sys = this.context.system.ioManager.getIo<SysIo>('Sys');

    return Sys.reboot();
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
