import * as path from 'path';

import Os from '../../shared/Os';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../shared/GroupConfigParser';
import {
  HOST_ENVSET_DIR,
  HOST_TMP_DIR, HOST_VAR_DATA_DIR,
  HOSTS_WORK_DIRS,
} from '../../shared/constants';
import {getOsMachine, resolveWorkDir} from '../../shared/helpers';
import NodejsMachines, {nodejsSupportedMachines} from '../interfaces/NodejsMachines';


const DESTROY_TIMEOUT_SEC = 60;


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  varDataDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  destroyTimeoutSec: number = DESTROY_TIMEOUT_SEC;
  readonly force: boolean;
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
  private readonly groupConfig: GroupConfigParser;
  private _hostConfig?: PreHostConfig;
  private _machine?: NodejsMachines;


  constructor(
    os: Os,
    groupConfig: GroupConfigParser,
    argForce: boolean,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
  ) {
    this.os = os;
    this.groupConfig = groupConfig;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
    this.force = argForce;
  }


  async resolve() {
    this._machine = await this.resolveMachine();
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);

    this.validate();

    this.hostId = this.hostConfig.id as any;
    this.workDir = resolveWorkDir(path.join(HOSTS_WORK_DIRS, this.hostId), this.argWorkDir);

    this.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    this.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
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

}



// if (this.argWorkDir) {
//   this.workDir = path.resolve(process.cwd(), this.argWorkDir);
// }
// else {
//   // else use under a $SQUIDLET_ROOT
//   const squidletRoot: string = resolveSquidletRoot();
//
//   this.workDir = path.join(squidletRoot, HOSTS_WORK_DIRS, this.hostId);
// }

//this._hostConfig.ioSet = this.resolveIoSetConfig(this._hostConfig.ioSet);
// /**
//  * Replace ioSet config if specified --ioset and --ioset-props arguments.
//  * Merge if specified only --ioset
//  * Else just return as was specified in host config or undefined
//  */
// private resolveIoSetConfig(specifiedIoSetConfig?: IoSetConfig): IoSetConfig | undefined {
//   // replace current ioSet host's config param
//   if (this.argIosetProps) {
//
//     if (!this.argIoset) {
//       throw new Error(`If you specified a "--ioset-props" you should specify a "--ioset" argument`);
//     }
//
//     const parsedProps = JSON.parse(this.argIosetProps);
//
//     if (!_isPlainObject(parsedProps)) {
//       throw new Error(`Incorrect type of ioset props which is set in "-ioset-props" argument`);
//     }
//
//     const ioSetProps = this.parseIoSetString(this.argIoset);
//
//     return {
//       ...parsedProps,
//       ...ioSetProps,
//     };
//   }
//   // merge with current ioSet host's config param
//   else if (this.argIoset) {
//     const ioSetProps = this.parseIoSetString(this.argIoset);
//
//     return {
//       ...specifiedIoSetConfig,
//       ...ioSetProps,
//     };
//   }
//
//   // else return as is
//   return specifiedIoSetConfig;
// }

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
