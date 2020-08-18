import DriverFactoryBase from './base/DriverFactoryBase';
import LogPublisher from './LogPublisher';
import Sessions from './lib/Sessions';
import State from './lib/State';
import HostConfig from './interfaces/HostConfig';
import System from './System';
import {makeUniqId} from './lib/uniqId';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from './constants';
import IoItem from './interfaces/IoItem';
import DriverBase from './base/DriverBase';
import ServiceBase from './base/ServiceBase';
import systemConfig from './systemConfig';
import {mergeDeepObjects} from './lib/objects';
import {AppType} from './interfaces/AppType';
import {pathJoin} from './lib/paths';
import StorageIo from './interfaces/io/StorageIo';


export default class Context {
  readonly system: System;
  readonly hostConfigOverride?: HostConfig;
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
    return this.system.wasAppInitialized;
  }

  private hostConfig?: HostConfig;


  constructor(system: System, hostConfigOverride?: HostConfig) {
    this.system = system;
    this.hostConfigOverride = hostConfigOverride;
  }


  async init() {
    const loadedConfig = await this.system.envSet.loadConfig<HostConfig>(
      systemConfig.fileNames.hostConfig
    );
    const storageIo: StorageIo = await this.system.ioManager.getIo<StorageIo>(
      'Storage'
    );
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.varData,
      systemConfig.envSetDirs.system,
      START_APP_TYPE_FILE_NAME,
    );
    // TODO: что по умолчанию? updater?
    let appType: AppType = 'app';
    // load tmp/startAppType file
    if (await storageIo.exists(startAppTypeFileName)) {
      appType = await storageIo.readFile(startAppTypeFileName) as any;
    }

    // TODO: может дать возможность перепределить appType?
    this.hostConfig = mergeDeepObjects({
      ...this.hostConfigOverride,
      appType,
    }, loadedConfig) as any;
  }

  destroy() {
    this.sessions.destroy();
    this.state.destroy();
  }


  getIo<T extends IoItem>(ioName: string): T {
    return this.system.ioManager.getIo<T>(ioName);
  }

  /**
   * Get driver itself.
   */
  getDriver<T extends DriverBase = DriverBase>(driverName: string): T {
    return this.system.driversManager.getDriver<T>(driverName);
  }

  /**
   * Ask the driver which is factory to create or get an instance of sub driver e.g. http server.
   * It will return an instance according to props.
   */
  async getSubDriver<T extends DriverBase = DriverBase>(
    driverName: string,
    props: {[index: string]: any}
  ): Promise<T> {
    const driver: DriverFactoryBase = this.getDriver<any>(driverName);

    return await driver.subDriver(props) as T;
  }

  getService<T extends ServiceBase = ServiceBase>(serviceId: string): T {
    return this.system.servicesManager.getService<T>(serviceId);
  }

  // getDevice<T extends DeviceBase>(deviceId: string): T {
  //   return this.system.devicesManager.getDevice<T>(deviceId);
  // }

  onDriversInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.wasDriversInitialized, SystemEvents.driversInitialized, cb);
  }

  onServicesInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.wasServicesInitialized, SystemEvents.servicesInitialized, cb);
  }

  onDevicesInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.wasDevicesInitialized, SystemEvents.devicesInitialized, cb);
  }

  onAppInit(cb: () => Promise<void>): number {
    return this.addListenerOnce(this.system.wasAppInitialized, SystemEvents.appInitialized, cb);
  }

  onBeforeDestroy(cb: () => Promise<void>): number {
    return this.system.events.once(SystemEvents.beforeDestroy, cb);
  }

  // TODO: add off events


  private addListenerOnce(isFulfilled: boolean, eventName: SystemEvents, cb: () => Promise<void>): number {
    // call immediately if devices are initialized
    if (isFulfilled) {
      try {
        const promise: Promise<void> | undefined = cb();

        if (promise) promise.catch(this.log.error);
      }
      catch (err) {
        this.log.error(err);
      }

      return -1;
    }

    return this.system.events.once(eventName, cb);
  }

}
