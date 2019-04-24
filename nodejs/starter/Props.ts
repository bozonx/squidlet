import _isPlainObject = require('lodash/isPlainObject');
import * as path from 'path';

import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../shared/GroupConfigParser';
import {
  HOST_ENVSET_DIR,
  HOST_TMP_DIR,
  HOSTS_WORK_DIRS, IOSET_STRING_DELIMITER
} from '../../shared/constants';
import {getOsMachine, resolveSquidletRoot} from '../../shared/helpers';
import NodejsMachines, {nodejsSupportedMachines} from '../interfaces/NodejsMachines';
import IoSetTypes, {allowedIoSetTypes} from '../../hostEnvBuilder/interfaces/IoSetTypes';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  get hostConfig(): PreHostConfig {
    return this._hostConfig as any;
  }
  get machine(): NodejsMachines {
    return this._machine as any;
  }

  private readonly os: Os;
  private readonly argMachine?: NodejsMachines;
  private readonly argHostName?: string;
  private readonly argWorkDir?: string;
  private readonly argIoset?: string;
  private readonly argIosetProps?: string;
  private readonly groupConfig: GroupConfigParser;
  private _hostConfig?: PreHostConfig;
  private _machine?: NodejsMachines;


  constructor(
    os: Os,
    groupConfig: GroupConfigParser,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    argIoset?: string,
    argIosetProps?: string
  ) {
    this.os = os;
    this.groupConfig = groupConfig;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
    this.argIoset = argIoset;
    this.argIosetProps = argIosetProps;
  }


  async resolve() {
    this._machine = await this.resolveMachine();
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);

    this.validate();

    this._hostConfig = this.modifyHostConfig(this._hostConfig);

    this.hostId = this.hostConfig.id as any;

    if (this.argWorkDir) {
      this.workDir = path.resolve(process.cwd(), this.argWorkDir);
    }
    else {
      // else use under a $SQUIDLET_ROOT
      const squidletRoot: string = resolveSquidletRoot();

      this.workDir = path.join(squidletRoot, HOSTS_WORK_DIRS, this.hostId);
    }

    this.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
  }


  private validate() {
    if (!this._hostConfig) {
      throw new Error(`You have to define host config`);
    }
    else if (!this._hostConfig.id) {
      throw new Error(`You have to specify an host id in your host config`);
    }
    else if (this.argHostName && this.argHostName !== this.hostConfig.id) {
      throw new Error(`Param "id" of host config "${this.hostId}" is not as specified as`
        + ` a command argument "${this.argHostName}"`);
    }
    else if (this.platform !== this.hostConfig.platform) {
      throw new Error(`Param "platform" of host config "${this.hostId}" is not a "${this.platform}"`);
    }
  }

  private async resolveMachine(): Promise<NodejsMachines> {
    if (this.argMachine) {
      if (!nodejsSupportedMachines.includes(this.argMachine)) {
        throw new Error(`Unsupported machine type "${this.argMachine}"`);
      }

      return this.argMachine;
    }

    return getOsMachine(this.os);
  }

  private modifyHostConfig(hostConfig: PreHostConfig): PreHostConfig {

    // TODO: можно вообще ничего не указывать - тогда будут использованны локальные ioSet

    if (this.argIosetProps) {
      // replace current ioSet host's config param
      if (!this.argIoset) {
        throw new Error(`If you specified a "--ioset-props" you should specify a "--ioset" argument`);
      }

      const parsedProps = JSON.parse(this.argIosetProps);

      if (!_isPlainObject(parsedProps)) {
        throw new Error(`Incorrect type of ioset props which is set in "-ioset-props" argument`);
      }

      const ioSetProps = this.parseIoSetString(this.argIoset);

      hostConfig.ioSet = {
        ...parsedProps,
        ...ioSetProps,
      };
    }
    else if (this.argIoset) {
      // merge with current ioSet host's config param
      const ioSetProps = this.parseIoSetString(this.argIoset);

      hostConfig.ioSet = {
        ...hostConfig.ioSet,
        ...ioSetProps,
      };
    }

    return hostConfig;
  }

  private parseIoSetString(ioSetString: string): {type: IoSetTypes, host?: string, port?: number} {
    const splat = ioSetString.split(IOSET_STRING_DELIMITER);
    const type = splat[0] as IoSetTypes;

    if (!allowedIoSetTypes.includes(type)) {
      throw new Error(`Incorrect ioSet type "${type}"`);
    }

    return {
      type,
      host: splat[1],
      port: (splat[2]) ? parseInt(splat[2]) : undefined,
    };
  }

}

// /**
//  * Set config paths relative to squidlet work dir if it doesn't set.
//  */
// private setPathsToHostConfig() {
//   if (!this.hostConfig.config) {
//     this.hostConfig.config = {};
//   }
//
//   if (!this.hostConfig.config.envSetDir) {
//     this.hostConfig.config.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
//   }
//
//   if (!this.hostConfig.config.varDataDir) {
//     this.hostConfig.config.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
//   }
//
//   if (!this.hostConfig.config.tmpDir) {
//     this.hostConfig.config.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
//   }
// }
