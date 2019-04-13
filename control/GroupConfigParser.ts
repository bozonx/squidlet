import * as path from 'path';

import _isPlainObject = require('lodash/isPlainObject');
import _defaultsDeep = require('lodash/defaultsDeep');
import _uniq = require('lodash/uniq');

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import Io from '../hostEnvBuilder/Io';
import GroupConfig from './interfaces/GroupConfig';


export default class GroupConfigParser {
  readonly groupConfigPath: string;
  private readonly io: Io;
  private readonly preHostsConfigs: {[index: string]: PreHostConfig} = {};
  private plugins?: string[];
  private hostDefaults?: {[index: string]: any};
  get hosts(): {[index: string]: PreHostConfig} {
    return this.preHostsConfigs;
  }


  constructor(io: Io, groupConfigPath: string) {
    this.groupConfigPath = groupConfigPath;
    this.io = io;
  }

  async init() {
    const preGroupConfig = (await this.io.loadYamlFile(this.groupConfigPath)) as GroupConfig;

    this.validate(preGroupConfig);

    this.plugins = preGroupConfig.plugins;
    this.hostDefaults = preGroupConfig.hostDefaults;

    await this.makeHosts(preGroupConfig as GroupConfig);
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

  private async makeHosts(preGroupConfig: GroupConfig) {
    for (let hostConfigPathOrObj of preGroupConfig.hosts) {
      let hostConfig: PreHostConfig;

      if (typeof hostConfigPathOrObj === 'string') {
        hostConfig = await this.io.loadYamlFile(hostConfigPathOrObj);
      }
      else if (_isPlainObject(hostConfigPathOrObj)) {
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

    return preparedHostConfig;
  }

  private validate(preGroupConfig: GroupConfig) {
    if (!preGroupConfig.hosts) {
      throw new Error(`You have to specify a "hosts" param with list of hosts`);
    }
    else if (!Array.isArray(preGroupConfig.hosts)) {
      throw new Error(`"hosts" param of group config has to be an array`);
    }
    // plugins
    else if (preGroupConfig.plugins && !Array.isArray(preGroupConfig.plugins)) {
      throw new Error(`"plugins" param of group config has to be an array`);
    }
    // hostDefaults
    else if (preGroupConfig.hostDefaults && !_isPlainObject(preGroupConfig.hostDefaults)) {
      throw new Error(`"plugins" param of group config has to be an array`);
    }
  }

  private validateHostConfig(hostConfig: PreHostConfig) {
    if (!hostConfig.id) {
      throw new Error(`Host does't have an id: ${JSON.stringify(hostConfig)}`);
    }

    if (hostConfig.config) {
      if (hostConfig.config.envSetDir && !path.isAbsolute(hostConfig.config.envSetDir)) {
        throw new Error(`Host's config path "config.envSetDir" has to be an absolute`);
      }
      else if (hostConfig.config.varDataDir && !path.isAbsolute(hostConfig.config.varDataDir)) {
        throw new Error(`Host's config path "config.varDataDir" has to be an absolute`);
      }
      else if (hostConfig.config.tmpDir && !path.isAbsolute(hostConfig.config.tmpDir)) {
        throw new Error(`Host's config path "config.tmpDir" has to be an absolute`);
      }
    }
  }

}
