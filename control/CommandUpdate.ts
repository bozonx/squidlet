import * as yargs from 'yargs';
import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHost from './BuildHost';
import UpdateCommandParams from './interfaces/UpdateCommandParams';
import ResolveDirs from './ResolveDirs';


export default class CommandUpdate {
  private readonly io: Io = new Io();
  private readonly params: UpdateCommandParams = this.resolveParams();
  private readonly groupConfig: GroupConfigParser = new GroupConfigParser(
    this.io,
    this.params.groupConfigPath
  );
  private dirs: ResolveDirs = new ResolveDirs();


  constructor() {
  }


  async start() {
    await this.groupConfig.init();

    this.dirs.resolve(this.groupConfig, this.params.buildDir, this.params.tmpDir);

    // clear whole tmp dir
    await this.io.rimraf(`${this.groupConfig.tmpDir}/**/*`);

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
    const result: UpdateCommandParams = {
      // if specified only group config
      groupConfigPath: yargs.argv._[1],
      buildDir: process.env.BUILD_DIR || <string | undefined>yargs.argv['build-dir'],
      tmpDir: process.env.TMP_DIR || <string | undefined>yargs.argv['tmp-dir'],
    };

    // specified host name and group config
    if (yargs.argv._[1] && yargs.argv._[2]) {
      result.hostName = yargs.argv._[1];
      result.groupConfigPath = yargs.argv._[2];
    }
    else if (!yargs.argv._[1] && !yargs.argv._[2]) {
      throw new Error(`You should specify a group config path`);
    }

    // resolve relative buildDir
    if (result.buildDir) result.buildDir = path.resolve(process.cwd(), result.buildDir);
    // resolve relative tmpDir
    if (result.tmpDir) result.tmpDir = path.resolve(process.cwd(), result.tmpDir);

    return result;
  }


  private async updateHost(hostConfig: PreHostConfig) {
    const buildHost: BuildHost = new BuildHost(hostConfig, buildDir, tmpDir, this.io);

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHost.build();

    const updateHost: UpdateHost = new UpdateHost(hostConfig, buildDir, tmpDir, this.io);

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

}
