import * as yargs from 'yargs';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHostEnv from './BuildHostEnv';
import ResolveDirs from './ResolveDirs';
import BuildSystem from './BuildSystem';
import BuildDevs from './BuildDevs';


interface UpdateCommandParams {
  groupConfigPath: string;
  hostName?: string;
}


export default class CommandUpdate {
  private readonly io: Io = new Io();
  private readonly params: UpdateCommandParams = this.resolveParams();
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(
    this.io,
    this.params.groupConfigPath
  );
  private dirs: ResolveDirs = new ResolveDirs();
  private readonly buildSystem: BuildSystem = new BuildSystem(this.io);


  async start() {
    this.dirs.resolve();
    await this.groupConfig.init();

    // clear whole tmp dir
    await this.io.rimraf(`${this.groupConfig.tmpDir}/**/*`);

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
    if (yargs.argv._[1] && !yargs.argv._[2]) {
      return {
        groupConfigPath: yargs.argv._[1],
      };
    }
    // specified host name and group config
    else if (yargs.argv._[1] && yargs.argv._[2]) {
      return {
        hostName: yargs.argv._[1],
        groupConfigPath: yargs.argv._[2],
      };
    }

    throw new Error(`You should specify a group config path`);
  }

  private async updateHost(hostConfig: PreHostConfig) {
    await this.buildHostDevs(hostConfig);
    await this.buildHostEnv(hostConfig);
    await this.uploadToHost(hostConfig);
  }

  private async buildHostDevs(hostConfig: PreHostConfig) {
    const buildDevs: BuildDevs = new BuildDevs(
      this.io,
      hostConfig,
      this.dirs.hostsBuildDir,
      this.dirs.hostsTmpDir
    );

    console.info(`===> Building devs`);

    await buildDevs.build();
  }

  private async buildHostEnv(hostConfig: PreHostConfig) {
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      this.dirs.hostsBuildDir,
      this.dirs.hostsTmpDir
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
