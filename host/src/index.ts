import System from './app/System';
import ParseMasterConfig from '../../master/ParseMasterConfig';
import HostConfig from './app/interfaces/HostConfig';


export default class Master {
  readonly system: System;
  private readonly configs: ParseMasterConfig;

  constructor(fullConfig: {[index: string]: any}) {
    this.configs = new ParseMasterConfig(fullConfig);
    const masterConfig: HostConfig = this.configs.getHostConfig('master');

    this.system = new System(masterConfig);
  }

  async init(): Promise<void> {
    await this.system.initDrivers();
    await this.system.initNetwork();
    await this.system.initMessenger();

    // TODO: init master network configurator
    // TODO: init master updater
    // TODO: init master configurator

    await this.system.initApp();
  }

}
