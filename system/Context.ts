import systemConfig from './config/systemConfig';
import LogPublisher from './LogPublisher';
import Sessions from './lib/Sessions';
import State from './State';
import HostConfig from './interfaces/HostConfig';
import System from './System';
import {mergeDeep} from './lib/collections';
import {makeUniqId} from './lib/uniqId';
import IndexedEventEmitter from './lib/IndexedEventEmitter';


export enum AppLifeCycleEvents {
  systemDriversInitialized,
  systemServicesInitialized,
  devicesInitialized,
  appInitialized,
  beforeDestroy,
}


export default class Context {
  readonly system: System;
  // TODO: лучше пусть будет в system - но сделать обертку здесь для навешивания на события
  readonly events = new IndexedEventEmitter();
  readonly systemConfig: typeof systemConfig;
  readonly log: LogPublisher = new LogPublisher(this);
  readonly sessions: Sessions = new Sessions(makeUniqId);
  readonly state: State = new State();
  get id(): string {
    return this.config.id;
  }
  get config(): HostConfig {
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

  }

  async initConfig() {
    // TODO: load host config
  }

  destroy() {
    this.sessions.destroy();
    this.state.destroy();
    this.events.destroy();
  }


  onDevicesInit(cb: () => void): number {
    // call immediately if devices are initialized
    if (this.system.isDevicesInitialized) {
      cb();

      return -1;
    }

    return this.events.once(AppLifeCycleEvents.devicesInitialized, cb);
  }

  onAppInit(cb: () => void): number {
    // call immediately if app is initialized
    if (this.system.isAppInitialized) {
      cb();

      return -1;
    }

    return this.events.once(AppLifeCycleEvents.appInitialized, cb);
  }

}
