import * as yargs from 'yargs';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHostEnv from './BuildHostEnv';
import ResolveDirs from './ResolveDirs';
import BuildHostDist from './BuildHostDist';
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
  private readonly buildHostDist: BuildHostDist = new BuildHostDist(this.io);


  async start() {
    await this.groupConfig.init();

    this.dirs.resolve(this.groupConfig);

    // clear whole tmp dir
    await this.io.rimraf(`${this.groupConfig.tmpDir}/**/*`);

    console.info(`===> Building system`);
    await this.buildHostDist.build(this.dirs.hostDistBuildDir, this.dirs.hostDistTmpDir);

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

    // TODO: какие dirs передать

    const buildDevs: BuildDevs = new BuildDevs(
      this.io,
      hostConfig.platform,
      hostConfig.machine,
      this.dirs.hostDistBuildDir,
      this.dirs.hostDistTmpDir
    );

    console.info(`===> Building devs`);

    if (!hostConfig.platform) {
      throw new Error(`Host config doesn't have a platform param`);
    }
    else if (!hostConfig.machine) {
      throw new Error(`Host config doesn't have a machine param`);
    }

    await buildDevs.build();

    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      this.dirs.hostsEnvBuildDir,
      this.dirs.hostsTmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();

    const updateHost: UpdateHost = new UpdateHost(
      this.io,
      hostConfig,
      this.dirs.hostsEnvBuildDir,
      this.dirs.hostsTmpDir
    );

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

}
