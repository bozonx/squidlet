import * as path from 'path';
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
  private _buildDir?: string;
  private _tmpDir?: string;
  get hosts(): {[index: string]: PreHostConfig} {
    return this.preHostsConfigs;
  }
  get buildDir(): string {
    return this._buildDir as any;
  }
  get tmpDir(): string {
    return this._tmpDir as any;
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
    this._buildDir = this.resolvePath('build-dir', preGroupConfig.buildDir);
    this._tmpDir = this.resolvePath('tmp-dir', preGroupConfig.tmpDir);

    if (!this._buildDir) {
      throw new Error(`You have to specify a buildDir in group config or as a command argument or environment variable`);
    }

    if (!this._tmpDir) {
      this._tmpDir = path.join(this.buildDir, '__tmp');
    }

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

  private resolvePath(argParamName: string, pathInConfig?: string): string {
    // TODO: make it

    //   const relativeBuildDir: string | undefined = process.env.BUILD_DIR || <string>yargs.argv['build-dir'];
//   const buildDir: string | undefined = relativeBuildDir && path.resolve(process.cwd(), relativeBuildDir);
  }

  private validate(preGroupConfig: {[index: string]: any}) {
    if (!preGroupConfig.hosts) {
      throw new Error(`You have to specify a "hosts" param with list of hosts`);
    }
    else if (!Array.isArray(preGroupConfig.hosts)) {
      throw new Error(`"hosts" param of group config has to be an array`);
    }
    // buildDir
    else if (preGroupConfig.buildDir && typeof preGroupConfig.buildDir !== 'string') {
      throw new Error(`"buildDir" param of group config has to be a string`);
    }
    // tmpDir
    else if (preGroupConfig.tmpDir && typeof preGroupConfig.tmpDir !== 'string') {
      throw new Error(`"tmpDir" param of group config has to be a string`);
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
