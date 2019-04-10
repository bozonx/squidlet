import _isPlainObject = require('lodash/isPlainObject');

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
    for (let hostConfig of preGroupConfig.hosts) {
      if (typeof hostConfig === 'string') {
        const loadedHostConfig: PreHostConfig = await this.io.loadYamlFile(hostConfig);

        this.makeHostConfig(loadedHostConfig);
      }
      else if (_isPlainObject(hostConfig)) {
        this.makeHostConfig(hostConfig);
      }
      else {
        throw new Error(`Host config has to be a path to yaml file or an object`);
      }
    }
  }

  private makeHostConfig(hostConfig: PreHostConfig) {
    this.preHostsConfigs['host'] = {id: 'host'};
  }

  private validate(preGroupConfig: {[index: string]: any}) {
    if (!preGroupConfig.hosts) {
      throw new Error(`You have to specify a "hosts" param with list of hosts`);
    }
    else if (!Array.isArray(preGroupConfig.hosts)) {
      throw new Error(`"hosts" param of group config has to be an array`);
    }

    // TODO: test plugins and defaults
  }

}
