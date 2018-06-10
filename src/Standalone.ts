import System from './app/System';
import ParseMasterConfig from './master/ParseMasterConfig';
import HostConfig from './app/interfaces/HostConfig';


export default class Standalone {
  readonly system: System;
  private readonly configs: ParseMasterConfig;

  constructor(fullConfig: {[index: string]: any}) {
    this.configs = new ParseMasterConfig(fullConfig);
    const masterConfig: HostConfig = this.configs.getHostConfig('master');

    this.system = new System(masterConfig);
  }

  async init(): Promise<void> {
    await this.system.initSystemDrivers();

    // TODO: only if allowed - by default is off
    await this.system.initNetwork();
    // TODO: only if allowed - by default is off
    await this.system.initMessenger();

    await this.system.initApp();
  }

}
