import * as yargs from 'yargs';
import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHost from './BuildHost';
import UpdateCommandParams from './interfaces/UpdateCommandParams';


export default class CommandUpdate {
  private io: Io = new Io();

  constructor() {
  }

  async start() {
    const params: UpdateCommandParams = this.resolveParams();
    const groupConfig: GroupConfigParser = new GroupConfigParser(
      this.io,
      params.groupConfigPath,
      params.buildDir,
      params.tmpDir
    );

    await groupConfig.init();
    // clear whole tmp dir
    await this.io.rimraf(`${groupConfig.tmpDir}/**/*`);

    // update only specified host
    if (params.hostName) {
      if (!groupConfig.hosts[params.hostName]) {
        throw new Error(`Can't find host "${params.hostName}" in group config`);
      }

      await this.updateHost(groupConfig.hosts[params.hostName], groupConfig.buildDir, groupConfig.tmpDir);
    }
    // update all the hosts
    else {
      for (let currentHostName of Object.keys(groupConfig.hosts)) {
        await this.updateHost(groupConfig.hosts[currentHostName], groupConfig.buildDir, groupConfig.tmpDir);
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


  private async updateHost(hostConfig: PreHostConfig, buildDir: string, tmpDir: string) {
    const buildHost: BuildHost = new BuildHost(hostConfig, buildDir, tmpDir, this.io);

    console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
    await buildHost.build();

    const updateHost: UpdateHost = new UpdateHost(hostConfig, buildDir, tmpDir, this.io);

    console.info(`===> updating host "${hostConfig.id}"`);
    await updateHost.update();
  }

}
