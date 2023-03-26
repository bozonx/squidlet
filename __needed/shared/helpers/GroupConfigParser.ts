import * as path from 'path';
import _defaultsDeep = require('lodash/defaultsDeep');
import _uniq = require('lodash/uniq');

import {isPlainObject} from '../../../../squidlet-lib/src/objects';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import Os from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import GroupConfig from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/interfaces/GroupConfig.js';
import hostDefaultConfig from '../../hostEnvBuilder/configs/hostDefaultConfig';


export default class GroupConfigParser {
  readonly groupConfigPath?: string;
  private readonly os: Os;
  private readonly preHostsConfigs: {[index: string]: PreHostConfig} = {};
  private plugins?: string[];
  private hostDefaults?: {[index: string]: any};
  get hosts(): {[index: string]: PreHostConfig} {
    return this.preHostsConfigs;
  }

  get groupConfigDir(): string | undefined {
    if (!this.groupConfigPath) return;

    return path.dirname(path.resolve(process.cwd(), this.groupConfigPath));
  }


  constructor(os: Os, groupConfigPath?: string) {
    this.groupConfigPath = groupConfigPath;
    this.os = os;
  }

  async init() {
    const preConfig = await this.loadPreConfig();

    if (preConfig.hosts) {
      const preGroupConfig = preConfig as GroupConfig;
      // it's a group config
      this.validateGroupConfig(preGroupConfig);

      this.plugins = preGroupConfig.plugins;
      this.hostDefaults = preGroupConfig.hostDefaults;

      await this.makeHosts(preGroupConfig as GroupConfig);
    }
    else {
      // it's just a host config
      const preHostConfig = preConfig as PreHostConfig;

      this.validateHostConfig(preHostConfig);

      this.plugins = preHostConfig.plugins;
      this.hosts[preHostConfig.id as string] = this.prepareHostConfig(preHostConfig);
    }
  }


  getHostConfig(hostName: string | undefined): PreHostConfig {
    if (typeof hostName === 'undefined') {
      const hostNames: string[] = Object.keys(this.hosts);

      if (!hostNames.length) {
        throw new Error(`There aren't any hosts in a group config`);
      }

      return this.hosts[hostNames[0]];
    }
    else if (this.hosts[hostName]) {
      return this.hosts[hostName];
    }

    throw new Error(`Can't find host "${hostName}" in a group config`);
  }

  /**
   * Load config that can be a group config or just a host config.
   * Or use host defaults if there isn't a specified config path.
   */
  private async loadPreConfig(): Promise<{[index: string]: any}> {
    if (this.groupConfigPath) {
      const preConfig = await this.os.loadYamlFile(this.groupConfigPath) as any;

      if (!isPlainObject(preConfig)) {
        throw new Error(`Config has to be an object`);
      }

      return preConfig;
    }

    return {
      id: 'single',
      ...hostDefaultConfig,
    };
  }

  private async makeHosts(preGroupConfig: GroupConfig) {
    for (let hostConfigPathOrObj of preGroupConfig.hosts) {
      let hostConfig: PreHostConfig;

      if (typeof hostConfigPathOrObj === 'string') {
        hostConfig = await this.os.loadYamlFile(hostConfigPathOrObj);
      }
      else if (isPlainObject(hostConfigPathOrObj)) {
        hostConfig = hostConfigPathOrObj;
      }
      else {
        throw new Error(`Host config has to be a path to yaml file or an object`);
      }

      this.validateHostConfig(hostConfig);

      this.hosts[hostConfig.id as string] = this.makeHostConfig(hostConfig);
    }
  }

  private makeHostConfig(hostConfig: PreHostConfig): PreHostConfig {
    const preparedHostConfig: PreHostConfig = _defaultsDeep({}, hostConfig, this.hostDefaults);

    // TODO: проверку на уникальность делать после резолва
    preparedHostConfig.plugins = _uniq([
      ...preparedHostConfig.plugins || [],
      ...this.plugins || [],
    ]);

    return this.prepareHostConfig(preparedHostConfig);
  }

  private prepareHostConfig(hostConfig: PreHostConfig): PreHostConfig {
    const groupConfigDir: string | undefined = this.groupConfigDir;

    return {
      ...hostConfig,
      plugins: (hostConfig.plugins || []).map((item) => {
        if (!groupConfigDir) {
          throw new Error(`Can't resolve plugin paths because of there isn't a groupConfigPath`);
        }

        return path.resolve(groupConfigDir, item);
      })
    };
  }

  private validateGroupConfig(preGroupConfig: GroupConfig) {
    if (!preGroupConfig.hosts) {
      //throw new Error(`You have to specify a "hosts" param with list of hosts`);

      // it's a just host config
      return;
    }

    if (!Array.isArray(preGroupConfig.hosts)) {
      throw new Error(`"hosts" param of group config has to be an array`);
    }
    // plugins
    else if (preGroupConfig.plugins && !Array.isArray(preGroupConfig.plugins)) {
      throw new Error(`"plugins" param of group config has to be an array`);
    }
    // hostDefaults
    else if (preGroupConfig.hostDefaults && !isPlainObject(preGroupConfig.hostDefaults)) {
      throw new Error(`"plugins" param of group config has to be an array`);
    }
  }

  private validateHostConfig(hostConfig: PreHostConfig) {
    if (!hostConfig.id) {
      throw new Error(`Host does't have an id`);
    }

    // if (hostConfig.config) {
    //   if (hostConfig.config.envSetDir && !path.isAbsolute(hostConfig.config.envSetDir)) {
    //     throw new Error(`Host's config path "config.envSetDir" has to be an absolute`);
    //   }
    //   else if (hostConfig.config.varDataDir && !path.isAbsolute(hostConfig.config.varDataDir)) {
    //     throw new Error(`Host's config path "config.varDataDir" has to be an absolute`);
    //   }
    //   else if (hostConfig.config.tmpDir && !path.isAbsolute(hostConfig.config.tmpDir)) {
    //     throw new Error(`Host's config path "config.tmpDir" has to be an absolute`);
    //   }
    // }
  }

}
