import * as path from 'path';

import Os, {SpawnCmdResult} from '../../shared/Os';
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
import {isKindOfNumber} from '../../system/lib/common';
import LogLevel, {LOG_LEVELS} from '../../system/interfaces/LogLevel';


export default class Props {
  workDir: string = '';
  envSetDir: string = '';
  varDataDir: string = '';
  tmpDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  uid?: number;
  gid?: number;
  destroyTimeoutSec: number = DESTROY_SYTEM_TIMEOUT_SEC;
  readonly force: boolean;
  readonly argLogLevel?: LogLevel;
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
  private readonly argUser?: string;
  private readonly argGroup?: string;
  private _hostConfig?: PreHostConfig;
  private _machine?: NodejsMachines;


  constructor(
    os: Os,
    groupConfig: GroupConfigParser,
    argForce?: boolean,
    argLogLevel?: LogLevel,
    argMachine?: NodejsMachines,
    argHostName?: string,
    argWorkDir?: string,
    // TODO: test
    argUser?: string,
    argGroup?: string,
  ) {
    this.os = os;
    this.groupConfig = groupConfig;
    this.force = Boolean(argForce);
    this.argLogLevel = argLogLevel;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
    this.argUser = argUser;
    this.argGroup = argGroup;
  }


  async resolve() {
    this._machine = await this.resolveMachine();
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);
    this.uid = await this.resolveUser();
    this.gid = await this.resolveGroup();

    this.validate();

    this.hostId = this.hostConfig.id as any;

    const hostWorkDir = path.join(HOSTS_WORK_DIRS, this.hostId);

    this.workDir = this.resolveWorkDir(hostWorkDir);

    this.envSetDir = path.join(this.workDir, HOST_ENVSET_DIR);
    this.varDataDir = path.join(this.workDir, HOST_VAR_DATA_DIR);
    this.tmpDir = path.join(this.workDir, HOST_TMP_DIR);
  }


  private validate() {
    if (this.argLogLevel && !LOG_LEVELS.includes(this.argLogLevel)) {
      throw new Error(`Invalid "log-level" param: ${this.argLogLevel}`);
    }

    // if (this.platform !== this.hostConfig.platform) {
    //   throw new Error(`Param "platform" of host config "${this.hostId}" is not a "${this.platform}"`);
    // }
  }

  private async resolveMachine(): Promise<NodejsMachines> {
    if (this.argMachine) {
      if (!nodejsSupportedMachines.includes(this.argMachine)) {
        throw new Error(`Unsupported machine type "${this.argMachine}"`);
      }

      return this.argMachine;
    }

    return this.getOsMachine();
  }

  private resolveWorkDir(hostWorkDir: string): string {
    return resolveWorkDir(hostWorkDir, this.argWorkDir);
  }

  private getOsMachine(): Promise<NodejsMachines> {
    return getOsMachine(this.os);
  }

  // TODO: test
  private async resolveUser(): Promise<number | undefined> {
    if (!this.argUser) {
      return;
    }
    else if (isKindOfNumber(this.argUser)) {
      return parseInt(this.argUser);
    }

    return this.getIdResult('u', this.argUser);
  }

  // TODO: test
  private async resolveGroup(): Promise<number | undefined> {
    if (this.argGroup && !this.argUser) {
      throw new Error(`The "user" argument hasn't been set`);
    }
    else if (!this.argGroup) {
      return;
    }
    else if (isKindOfNumber(this.argGroup)) {
      return parseInt(this.argGroup);
    }

    return this.getIdResult('g', this.argGroup);
  }

  // TODO: test
  private async getIdResult(userOrGroup: 'u' | 'g', name: string): Promise<number> {
    const cmd = `id -${userOrGroup} ${name}`;
    const result: SpawnCmdResult = await this.os.spawnCmd(cmd);

    if (result.status) {
      throw new Error(`Can't resolve id "${cmd}": status ${result.status} ${result.stderr.join(', ')}`);
    }

    return parseInt( result.stdout.join('').trim() );
  }

}
