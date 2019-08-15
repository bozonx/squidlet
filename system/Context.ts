import systemConfig from './config/systemConfig';
import LogPublisher from './LogPublisher';
import Sessions from './lib/Sessions';
import State from './lib/State';
import HostConfig from './interfaces/HostConfig';
import System from './System';
import {mergeDeep} from './lib/collections';
import {makeUniqId} from './lib/uniqId';
import {AppLifeCycleEvents} from './constants';


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
    // TODO: review
    //return this.hostConfig as HostConfig;
    return await this.envSet.loadConfig<HostConfig>(
      this.system.initializationConfig.fileNames.hostConfig
    );
  }

  private hostConfig?: HostConfig;

  get isInitialized() {
    return this.system.isAppInitialized;
  }


  constructor(system: System, systemConfigExtend?: {[index: string]: any}) {
    this.system = system;
    this.systemConfig = mergeDeep(systemConfigExtend, systemConfig) as any;
  }


  async init() {
    // TODO: ???
  }

  // TODO: ??? add getIo ???
  // TODO: ??? add getDriver ???
  // TODO: ??? add getService ???
  // TODO: ???????? add getDevice ???

  async initConfig() {
    // TODO: load host config
  }

  destroy() {
    this.sessions.destroy();
    this.state.destroy();
  }


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
