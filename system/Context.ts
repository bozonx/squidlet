import systemConfig from './config/systemConfig';
import LogPublisher from './LogPublisher';
import Sessions from './lib/Sessions';
import State from './lib/State';
import HostConfig from './interfaces/HostConfig';
import System from './System';
import {mergeDeep} from './lib/collections';
import {makeUniqId} from './lib/uniqId';
import {AppLifeCycleEvents} from './constants';
import IoItem from './interfaces/IoItem';
import DriverBase from './base/DriverBase';
import ServiceBase from './base/ServiceBase';


export default class Context {
  readonly system: System;
  readonly systemConfig: typeof systemConfig;
  readonly log: LogPublisher = new LogPublisher(this);
  readonly sessions: Sessions = new Sessions(makeUniqId);
  readonly state: State = new State();
  get id(): string {
    return this.config.id;
  }
  get config(): HostConfig {
    return this.hostConfig as any;
  }
  get isInitialized() {
    return this.system.isAppInitialized;
  }

  private hostConfig?: HostConfig;


  constructor(system: System, systemConfigExtend?: {[index: string]: any}) {
    this.system = system;
    this.systemConfig = mergeDeep(systemConfigExtend, systemConfig) as any;
  }


  async init() {
    this.hostConfig = await this.system.envSet.loadConfig<HostConfig>(
      this.system.initializationConfig.fileNames.hostConfig
    );
  }

  destroy() {
    this.sessions.destroy();
    this.state.destroy();
  }


  getIo<T extends IoItem>(ioName: string): T {
    return this.system.ioManager.getIo<T>(ioName);
  }

  getDriver<T extends DriverBase>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  getService<T extends ServiceBase>(serviceId: string): T {
    return this.system.servicesManager.getService<T>(serviceId);
  }

  // getDevice<T extends DeviceBase>(deviceId: string): T {
  //   return this.system.devicesManager.getDevice<T>(deviceId);
  // }

  onDevicesInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.isDevicesInitialized, AppLifeCycleEvents.devicesInitialized, cb);
  }

  onAppInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.isAppInitialized, AppLifeCycleEvents.appInitialized, cb);
  }

  // TODO: может тоже сделать асинронный ???
  onBeforeDestroy(cb: () => void): number {
    return this.system.events.once(AppLifeCycleEvents.beforeDestroy, cb);
  }


  private addListenerOnce(isFulfilled: boolean, eventName: AppLifeCycleEvents, cb: () => Promise<void>): number {
    // call immediately if devices are initialized
    if (isFulfilled) {
      const promise: Promise<void> | undefined = cb();

      if (promise) promise.catch(this.log.error);

      return -1;
    }

    return this.system.events.once(eventName, cb);
  }

}
