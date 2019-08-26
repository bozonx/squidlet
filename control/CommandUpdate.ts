import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from '../shared/GroupConfigParser';
import Os from '../shared/Os';
import ResolveDirs, {Args} from './ResolveDirs';
import BuildSystem from '../shared/envSetBuild/BuildSystem';
import BuildIo from '../shared/envSetBuild/BuildIo';
import systemConfig from '../system/config/systemConfig';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';


interface UpdateCommandParams {
  groupConfigPath: string;
  hostName?: string;
}


export default class CommandUpdate {
  private readonly positionArgs: string[];
  private readonly os: Os = new Os();
  private readonly params: UpdateCommandParams = this.resolveParams();
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(
    this.os,
    this.params.groupConfigPath
  );
  private readonly dirs: ResolveDirs;
  private readonly buildSystem: BuildSystem = new BuildSystem(this.os);


  constructor(positionArgs: string[], args: {[index: string]: any}) {
    this.positionArgs = positionArgs;
    this.dirs = new ResolveDirs(args as Args);
  }


  async start() {
    this.dirs.resolve();
    await this.groupConfig.init();

    console.info(`Using working dir ${this.dirs.workDir}`);

    // clear whole tmp dir
    await this.os.rimraf(`${this.dirs.tmpDir}/**/*`);

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
    await this.buildIos(hostConfig);
    await this.buildEnvSet(hostConfig);
    await this.uploadToHost(hostConfig);
  }

  private async buildIos(preHostConfig: PreHostConfig) {
    if (!preHostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }
    else if (!preHostConfig.platform) {
      throw new Error(`Host config doesn't have a platform param`);
    }
    else if (!preHostConfig.machine) {
      throw new Error(`Host config doesn't have a machine param`);
    }

    const buildDir = path.join(this.dirs.hostsBuildDir, preHostConfig.id, systemConfig.envSetDirs.ios);
    const tmpDir = path.join(this.dirs.hostsTmpDir, preHostConfig.id, systemConfig.envSetDirs.ios);
    const buildIo: BuildIo = new BuildIo(
      this.os,
      preHostConfig.platform,
      preHostConfig.machine,
      buildDir,
      tmpDir
      // TODO: use owner options
    );

    console.info(`===> Building ios`);

    await buildIo.build();
  }

  private async buildEnvSet(hostConfig: PreHostConfig) {
    if (!hostConfig.id) {
      throw new Error(`Host has to have an id param`);
    }

    const hostBuildDir = path.join(this.dirs.hostsBuildDir, hostConfig.id);
    const hostTmpDir = path.join(this.dirs.hostsTmpDir, hostConfig.id);

    // TODO: remake - build configs and entities

    // const buildHostEnv: BuildHostEnv = new BuildHostEnv(
    //   this.os,
    //   hostConfig,
    //   hostBuildDir,
    //   hostTmpDir
    // );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    //await buildHostEnv.build();
  }

  private async uploadToHost(hostConfig: PreHostConfig) {
    const updateHost: UpdateHost = new UpdateHost(
      this.os,
      hostConfig,
      this.dirs.workDir,
      this.dirs.tmpDir
    );

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

  // async build() {
  //   await this.os.mkdirP(this.hostBuildDir);
  //   await this.os.mkdirP(this.hostTmpDir);
  //
  //   // TODO: удалить старые
  //
  //   // await this.os.rimraf(`${this.hostBuildDir}/**/*`);
  //   // await this.os.rimraf(`${this.hostTmpDir}/**/*`);
  //
  //   const envBuilder: EnvBuilder = new EnvBuilder(this.preHostConfig, this.hostBuildDir, this.hostTmpDir);
  //
  //   await envBuilder.collect();
  //   await envBuilder.writeConfigs();
  //   await envBuilder.writeEntities();
  // }

}
