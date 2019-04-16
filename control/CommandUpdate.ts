import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from '../shared/GroupConfigParser';
import Io from '../shared/Io';
import BuildHostEnv from '../shared/BuildHostEnv';
import ResolveDirs, {Args} from './ResolveDirs';
import BuildSystem from '../shared/BuildSystem';
import BuildDevs from '../shared/BuildDevs';
import {BUILD_DEVS_DIR} from '../shared/constants';


interface UpdateCommandParams {
  groupConfigPath: string;
  hostName?: string;
}


export default class CommandUpdate {
  private readonly positionArgs: string[];
  private readonly io: Io = new Io();
  private readonly params: UpdateCommandParams = this.resolveParams();
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(
    this.io,
    this.params.groupConfigPath
  );
  private readonly dirs: ResolveDirs;
  private readonly buildSystem: BuildSystem = new BuildSystem(this.io);


  constructor(positionArgs: string[], args: Args) {
    this.positionArgs = positionArgs;
    this.dirs = new ResolveDirs(args);
  }


  async start() {
    this.dirs.resolve();
    await this.groupConfig.init();

    console.info(`Using working dir ${this.dirs.workDir}`);

    // clear whole tmp dir
    await this.io.rimraf(`${this.dirs.tmpDir}/**/*`);

    console.info(`===> Building system`);
    await this.buildSystem.build(this.dirs.systemBuildDir, this.dirs.systemTmpDir);

    // update only specified host
    if (this.params.hostName) {
      if (!this.groupConfig.hosts[this.params.hostName]) {
        throw new Error(`Can't find host "${this.params.hostName}" in group config`);
      }

      await this.updateHost(this.groupConfig.hosts[this.params.hostName]);
    }
    // update all the hosts
    else {
      for (let currentHostName of Object.keys(this.groupConfig.hosts)) {
        await this.updateHost(this.groupConfig.hosts[currentHostName]);
      }
    }
  }


  private resolveParams(): UpdateCommandParams {
    // specified only config group path
    if (this.positionArgs[0] && !this.positionArgs[1]) {
      return {
        groupConfigPath: this.positionArgs[0],
      };
    }
    // specified host name and group config
    else if (this.positionArgs[0] && this.positionArgs[1]) {
      return {
        hostName: this.positionArgs[0],
        groupConfigPath: this.positionArgs[1],
      };
    }

    throw new Error(`You should specify a group config path`);
  }

  private async updateHost(hostConfig: PreHostConfig) {
    await this.buildDevs(hostConfig);
    await this.buildEnvSet(hostConfig);
    await this.uploadToHost(hostConfig);
  }

  private async buildDevs(hostConfig: PreHostConfig) {
    if (!hostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    const buildDir = path.join(this.dirs.hostsBuildDir, hostConfig.id, BUILD_DEVS_DIR);
    const tmpDir = path.join(this.dirs.hostsTmpDir, hostConfig.id, BUILD_DEVS_DIR);
    const buildDevs: BuildDevs = new BuildDevs(
      this.io,
      hostConfig,
      buildDir,
      tmpDir
    );

    console.info(`===> Building devs`);

    await buildDevs.build();
  }

  private async buildEnvSet(hostConfig: PreHostConfig) {
    if (!hostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    const hostBuildDir = path.join(this.dirs.hostsBuildDir, hostConfig.id);
    const hostTmpDir = path.join(this.dirs.hostsTmpDir, hostConfig.id);
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      hostBuildDir,
      hostTmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();
  }

  private async uploadToHost(hostConfig: PreHostConfig) {
    const updateHost: UpdateHost = new UpdateHost(
      this.io,
      hostConfig,
      this.dirs.workDir,
      this.dirs.tmpDir
    );

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

}
