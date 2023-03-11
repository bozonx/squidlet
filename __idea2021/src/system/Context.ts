import DriverFactoryBase from '../base/DriverFactoryBase';
import LogPublisher from '../../../__old/system/LogPublisher';
import Sessions from '../../../../squidlet-lib/src/Sessions';
import State from '../../../../squidlet-lib/src/State';
import HostConfig from '../../../__old/system/interfaces/HostConfig';
import System from '../../../__old/system/System';
import {makeUniqId} from '../../../../squidlet-lib/src/uniqId';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from '../../../__old/system/constants';
import IoItem from '../../../__old/system/interfaces/IoItem';
import DriverBase from '../base/DriverBase';
import ServiceBase from '../base/ServiceBase';
import systemConfig from '../../../__old/system/systemConfig';
import {mergeDeepObjects} from '../../../../squidlet-lib/src/objects';
import {AppType} from '../../../__old/system/interfaces/AppType';
import {pathJoin} from '../../../../squidlet-lib/src/paths';
import StorageIo from '../../../../squidlet-networking/src/interfaces/__old/io/StorageIo';
import ServicesObj from '../../../__old/system/interfaces/ServicesObj';
import {IoSetBase} from '../../../__old/system/interfaces/IoSet';
import EntityBase from '../base/EntityBase'
import DriverInstanceBase from '../base/DriverInstanceBase'


// TODO: rename to EntityContext


export default class Context {
  readonly system: System;
  readonly hostConfigOverride?: Partial<HostConfig>;
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
  get service(): ServicesObj {
    return this.system.servicesManager.service;
  }

  private hostConfig?: HostConfig;


  constructor(system: System, hostConfigOverride?: Partial<HostConfig>) {
    this.system = system;
    this.hostConfigOverride = hostConfigOverride;
  }


  async init() {
    const loadedConfig = await this.system.envSet.loadConfig<HostConfig>(
      systemConfig.fileNames.hostConfig
    );
    // use storage here because services hasn't been initialized at the moment
    const storageIo: StorageIo = await this.system.ioManager.getIo<StorageIo>(
      'Storage'
    );
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.varData,
      systemConfig.storageDirs.var,
      START_APP_TYPE_FILE_NAME,
    );
    let appType: AppType = 'app';
    // load varData/var/startAppType
    if (await storageIo.exists(startAppTypeFileName)) {
      appType = await storageIo.readFile(startAppTypeFileName) as any;
    }
    // it allows to override appType in hostConfigOverride
    this.hostConfig = mergeDeepObjects(this.hostConfigOverride, {
      ...loadedConfig,
      appType,
    }) as any;
  }

  destroy() {
    this.sessions.destroy();
    this.state.destroy();
  }


  /**
   * Get IO instance.
   * If virtualIoSet is defined then it will be used else the system's will be used.
   * @param ioName - name of IO like Serial, I2cMaster etc.
   * @param virtualIoSet - Name of virtual IO set service
   */
  getIo<T extends IoItem>(ioName: string, virtualIoSet?: string): T {
    if (virtualIoSet) {
      if (!this.service[ioName]) {
        throw new Error(`Can't find a virtual IO set "${virtualIoSet}"`);
      }

      const virtualIoSetService: IoSetBase = this.service[ioName];

      return virtualIoSetService.getIo<T>(ioName);
    }

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
  async getSubDriver<T extends DriverInstanceBase<any> = DriverInstanceBase>(
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
