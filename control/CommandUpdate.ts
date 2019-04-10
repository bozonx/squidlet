import * as yargs from 'yargs';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHostEnv from './BuildHostEnv';
import ResolveDirs from './ResolveDirs';
import BuildHostDist from './BuildHostDist';


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


  constructor() {
  }


  async start() {
    await this.groupConfig.init();

    this.dirs.resolve(this.groupConfig);

    // clear whole tmp dir
    await this.io.rimraf(`${this.groupConfig.tmpDir}/**/*`);

    await this.buildHostDist.build();

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
    const buildHostEnv: BuildHostEnv = new BuildHostEnv(
      this.io,
      hostConfig,
      this.dirs.hostsEnvBuildDir,
      this.dirs.hostsEnvTmpDir
    );

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHostEnv.build();

    const updateHost: UpdateHost = new UpdateHost(
      this.io,
      hostConfig,
      this.dirs.hostsEnvBuildDir,
      this.dirs.hostsEnvTmpDir
    );

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

}
