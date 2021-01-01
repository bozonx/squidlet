import * as path from 'path';

import Os, {SpawnCmdResult} from '../../shared/Os';
import Platforms from '../../system/interfaces/Platforms';
import PreHostConfig from '../../hostEnvBuilder/interfaces/PreHostConfig';
import GroupConfigParser from '../../shared/GroupConfigParser';
import {APP_WORK_DIR, BUILD_WORK_DIR, REPO_BUILD_DIR} from '../../shared/constants';
import {getOsMachine, REPO_ROOT} from '../../shared/helpers';
import NodejsMachines, {nodejsSupportedMachines} from '../../nodejs/interfaces/NodejsMachines';
import {isKindOfNumber} from '../../../../squidlet-lib/src/common';
import LogLevel, {LOG_LEVELS} from '../../system/interfaces/LogLevel';


//export type NoMachine = 'noMachine';


export default class Props {
  appWorkDir: string = '';
  buildWorkDir: string = '';
  platform: Platforms = 'nodejs';
  hostId: string = '';
  uid?: number;
  gid?: number;
  //readonly force: boolean;
  readonly argLogLevel?: LogLevel;
  machine?: NodejsMachines;
  get hostConfig(): PreHostConfig {
    return this._hostConfig as any;
  }


  private readonly os: Os;
  private readonly buildWorkDirRoot: string = '';
  //private readonly argMachine?: NodejsMachines | NoMachine;
  private readonly argHostName?: string;
  private readonly argWorkDir?: string;
  private readonly groupConfig: GroupConfigParser;
  private readonly argUser?: string | number;
  private readonly argGroup?: string | number;
  private _hostConfig?: PreHostConfig;


  constructor(
    os: Os,
    groupConfig: GroupConfigParser,
    buildWorkDirRoot: string,
    //argForce?: boolean,
    argLogLevel?: LogLevel,
    //argMachine?: NodejsMachines | NoMachine,
    argHostName?: string,
    argWorkDir?: string,
    // TODO: test
    argUser?: string | number,
    argGroup?: string | number,
  ) {
    this.os = os;
    this.groupConfig = groupConfig;
    this.buildWorkDirRoot = buildWorkDirRoot;
    //this.force = Boolean(argForce);
    this.argLogLevel = argLogLevel;
    this.argMachine = argMachine;
    this.argHostName = argHostName;
    this.argWorkDir = argWorkDir;
    this.argUser = argUser;
    this.argGroup = argGroup;
  }


  async resolve() {
    // TODO: review
    if (this.argMachine !== 'noMachine') {
      this.machine = await this.resolveMachine();
    }
    this._hostConfig = this.groupConfig.getHostConfig(this.argHostName);
    this.uid = await this.resolveUser();
    this.gid = await this.resolveGroup();

    this.validate();

    this.hostId = this.hostConfig.id as any;

    this.buildWorkDir = path.join(
      REPO_ROOT,
      REPO_BUILD_DIR,
      this.buildWorkDirRoot,
      this.hostId,
      BUILD_WORK_DIR
    );

    this.appWorkDir = this.resolveAppWorkDir();
  }


  private validate() {
    if (this.argGroup && !this.argUser) {
      throw new Error(`The "user" argument hasn't been set`);
    }

    if (this.argLogLevel && !LOG_LEVELS.includes(this.argLogLevel)) {
      throw new Error(`Invalid "log-level" param: ${this.argLogLevel}`);
    }
  }

  private async resolveMachine(): Promise<NodejsMachines | undefined> {
    if (this.argMachine === 'noMachine') return;

    if (this.argMachine) {
      if (!nodejsSupportedMachines.includes(this.argMachine)) {
        throw new Error(`Unsupported machine type "${this.argMachine}"`);
      }

      return this.argMachine;
    }

    return this.getOsMachine();
  }

  private resolveAppWorkDir(): string {
    if (this.argWorkDir) {
      // if it set as an argument - make it absolute
      return path.resolve(process.cwd(), this.argWorkDir);
    }

    return path.join(
      REPO_ROOT,
      REPO_BUILD_DIR,
      this.buildWorkDirRoot,
      this.hostId,
      APP_WORK_DIR
    );
  }

  private getOsMachine(): Promise<NodejsMachines> {
    return getOsMachine(this.os);
  }

}
