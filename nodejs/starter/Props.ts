import * as path from 'path';

import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../control/GroupConfigParser';
import ResolveArgs from './ResolveArgs';
import {HOST_ENVSET_DIR, HOST_TMP_DIR, HOST_VAR_DATA_DIR, HOSTS_WORK_DIRS} from '../../control/constants';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  platform: Platforms = 'nodejs';
  machine: string = '';
  hostId: string = '';
  private readonly groupConfig: GroupConfigParser;
  private readonly args: ResolveArgs;
  private _hostConfig?: PreHostConfig;

  get hostConfig(): PreHostConfig {
    return this._hostConfig as any;
  }


  constructor(args: ResolveArgs, groupConfig: GroupConfigParser) {
    this.args = args;
    this.groupConfig = groupConfig;
  }

  resolve() {
    this._hostConfig = this.groupConfig.getHostConfig(this.args.hostName);


    this.validate();

    this.machine = this.args.machine;
    this.hostId = this.hostConfig.id as any;
    this.workDir = path.join(this.args.squidletRoot, HOSTS_WORK_DIRS, this.hostId);

    this.setPathsToHostConfig();

    this.envSetDir = (this.hostConfig.config as any).envSetDir;
  }


  private validate() {
    if (!this._hostConfig) {
      throw new Error(`You have to define host config`);
    }
    else if (!this._hostConfig.id) {
      throw new Error(`You have to specify an host id in your host config`);
    }
    else if (this.args.hostName && this.args.hostName !== this.hostConfig.id) {
      throw new Error(`Param "id" of host config "${this.hostId}" is not as specified as a command argument "${this.args.hostName}"`);
    }
    else if (this.platform !== this.hostConfig.platform) {
      throw new Error(`Param "platform" of host config "${this.hostId}" is not a "${this.platform}"`);
    }
    else if (this.args.machine !== this.hostConfig.machine) {
      throw new Error(`Param "machine" of host config "${this.hostId}" is not a "${this.args.machine}"`);
    }

    if (this._hostConfig.config) {
      if (this._hostConfig.config.envSetDir && !path.isAbsolute(this._hostConfig.config.envSetDir)) {
        throw new Error(`Host's config path "config.envSetDir" has to be an absolute`);
      }
      else if (this._hostConfig.config.varDataDir && !path.isAbsolute(this._hostConfig.config.varDataDir)) {
        throw new Error(`Host's config path "config.varDataDir" has to be an absolute`);
      }
      else if (this._hostConfig.config.tmpDir && !path.isAbsolute(this._hostConfig.config.tmpDir)) {
        throw new Error(`Host's config path "config.tmpDir" has to be an absolute`);
      }
    }

  }

  /**
   * Set config paths relative to squidlet work dir if it doesn't set.
   */
  private setPathsToHostConfig() {
    if (!this.hostConfig.config) {
      this.hostConfig.config = {};
    }

    if (!this.hostConfig.config.envSetDir) {
      this.hostConfig.config.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    }

    if (!this.hostConfig.config.varDataDir) {
      this.hostConfig.config.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
    }

    if (!this.hostConfig.config.tmpDir) {
      this.hostConfig.config.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
    }
  }

}
