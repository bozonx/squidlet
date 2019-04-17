import Dev from '../interfaces/Dev';
import System from '../System';


export type DevClass = new () => Dev;


export default class DevManager {
  private readonly system: System;
  private devSet: {[index: string]: Dev} = {};


  constructor(system: System, devSet: {[index: string]: DevClass}) {
    this.system = system;

    // make dev instances
    for (let devNme of Object.keys(devSet)) {
      this.devSet[devNme] = new devSet[devNme]();
    }
  }

  async init() {
    // call initializing of instances
    for (let devNme of Object.keys(this.devSet)) {
      const dev: Dev = this.devSet[devNme];

      if (dev.init) dev.init();
    }

    const devsParams = await this.system.envSet.loadConfig<{[index: string]: any}>(
      this.system.initCfg.fileNames.devsDefinitions
    );

    // configure devs if need
    for (let devNme of Object.keys(devsParams)) {
      const dev: Dev | undefined = this.devSet[devNme];

      if (!dev) {
        this.system.log.warn(`devsDefinitions config has definition of dev which doesn't exist in list of devs`);

        continue;
      }
      else if (!dev || !dev.configure) {
        continue;
      }

      dev.configure(devsParams[devNme]);
    }
  }

  getDev<T extends Dev>(devName: string): T {
    if (!this.devSet[devName]) {
      throw new Error(`Can't find dev "${devName}"`);
    }

    return this.devSet[devName] as T;
  }

}
