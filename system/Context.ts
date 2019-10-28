import DriverFactoryBase from './base/DriverFactoryBase';
import LogPublisher from './LogPublisher';
import Sessions from './lib/Sessions';
import State from './lib/State';
import HostConfig from './interfaces/HostConfig';
import System from './System';
import {makeUniqId} from './lib/uniqId';
import {SystemEvents} from './constants';
import IoItem from './interfaces/IoItem';
import DriverBase from './base/DriverBase';
import ServiceBase from './base/ServiceBase';
import systemConfig from './systemConfig';


export default class Context {
  readonly system: System;
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


  constructor(system: System) {
    this.system = system;
  }


  async init() {
    this.hostConfig = await this.system.envSet.loadConfig<HostConfig>(
      systemConfig.fileNames.hostConfig
    );
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
