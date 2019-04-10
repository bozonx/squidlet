import _isPlainObject = require('lodash/isPlainObject');
import _defaultsDeep = require('lodash/defaultsDeep');
import _uniq = require('lodash/uniq');

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import Io from '../hostEnvBuilder/Io';
import GroupConfig from './interfaces/GroupConfig';


export default class GroupConfigParser {
  private readonly groupConfigPath: string;
  private readonly io: Io;
  private readonly preHostsConfigs: {[index: string]: PreHostConfig} = {};
  private plugins?: string[];
  private hostDefaults?: {[index: string]: any};
  get hosts(): {[index: string]: PreHostConfig} {
    return this.preHostsConfigs;
  }


  constructor(groupConfigPath: string, io: Io) {
    this.groupConfigPath = groupConfigPath;
    this.io = io;
  }

  async init() {
    const preGroupConfig: {[index: string]: any} = await this.io.loadYamlFile(this.groupConfigPath);

    this.validate(preGroupConfig);

    this.plugins = preGroupConfig.plugins;
    this.hostDefaults = preGroupConfig.hostDefaults;

    await this.makeHosts(preGroupConfig as GroupConfig);
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

      if (!hostConfig.id) {
        throw new Error(`Host does't have an id: ${JSON.stringify(hostConfigPathOrObj)}`);
      }

      this.hosts[hostConfig.id] = this.makeHostConfig(hostConfig);
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

  private validate(preGroupConfig: {[index: string]: any}) {
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

}
