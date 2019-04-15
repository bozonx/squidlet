import * as path from 'path';

import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../shared/GroupConfigParser';
import ResolveArgs from './ResolveArgs';
import {HOST_ENVSET_DIR, HOST_TMP_DIR, HOST_VAR_DATA_DIR, HOSTS_WORK_DIRS} from '../../shared/constants';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
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

    this.hostId = this.hostConfig.id as any;

    if (this.args.workDir) {
      this.workDir = this.args.workDir;
    }
    else {
      // else use under a $SQUIDLET_ROOT
      this.workDir = path.join(this.args.squidletRoot, HOSTS_WORK_DIRS, this.hostId);
    }

    this.setPathsToHostConfig();

    this.envSetDir = (this.hostConfig.config as any).envSetDir;
    this.tmpDir = (this.hostConfig.config as any).tmpDir;
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
