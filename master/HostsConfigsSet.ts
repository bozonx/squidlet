const _defaultsDeep = require('lodash/defaultsDeep');
const _cloneDeep = require('lodash/cloneDeep');

import HostConfig from '../host/src/app/interfaces/HostConfig';
import PreHostConfig from './interfaces/PreHostConfig';
import Main from './Main';
import hostDefaultConfig from './configs/hostDefaultConfig';


/**
 * Parse prepare hosts configs.
 */
export default class HostsConfigsSet {
  private readonly main: Main;
  // hosts configs by hostId
  private hostsConfigs: {[index: string]: HostConfig} = {};


  constructor(main: Main) {
    this.main = main;
  }

  getHostsIds(): string[] {
    return Object.keys(this.hostsConfigs);
  }

  getHostConfig(hostId: string): HostConfig {
    if (!this.hostsConfigs[hostId]) throw new Error(`Host "${hostId}" not found`);

    return this.hostsConfigs[hostId];
  }

  getHostsConfigs(): {[index: string]: HostConfig} {
    return this.hostsConfigs;
  }

  generate() {
    const rawHostsConfigs: {[index: string]: PreHostConfig} = this.main.masterConfigHosts;

    for (let hostId of Object.keys(rawHostsConfigs)) {
      const rawHostConfig: PreHostConfig = rawHostsConfigs[hostId];

      // final host config
      this.hostsConfigs[hostId] = this.generateHostConfig(rawHostConfig);
    }
  }

  private generateHostConfig(rawHostConfig: PreHostConfig) {
    return {
      platform: rawHostConfig.platform,
      host: this.mergeHostParams(rawHostConfig) as HostConfig['host'],
    };
  }

  /**
   * Merge params of host.
   */
  private mergeHostParams(rawHostConfig: PreHostConfig): {[index: string]: any} {
    // TODO: смержить ещё с platform config

    return _defaultsDeep(
      _cloneDeep(rawHostConfig.host),
      this.main.masterConfig.hostDefaults,
      hostDefaultConfig
    );
  }

}
