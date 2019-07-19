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
import {DESTROY_SYTEM_TIMEOUT_SEC} from './constanats';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  varDataDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  destroyTimeoutSec: number = DESTROY_SYTEM_TIMEOUT_SEC;
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
    this.force = argForce;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
  }


  async resolve() {
    this._machine = await this.resolveMachine();
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);

    this.validate();

    this.hostId = this.hostConfig.id as any;

    const hostWorkDir = path.join(HOSTS_WORK_DIRS, this.hostId);

    this.workDir = this.resolveWorkDir(hostWorkDir);

    this.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    this.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
  }


  private validate() {
    if (this.platform !== this.hostConfig.platform) {
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

  private resolveWorkDir(hostWorkDir: string): string {
    return resolveWorkDir(hostWorkDir, this.argWorkDir);
  }

}
