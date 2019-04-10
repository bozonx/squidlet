import * as yargs from 'yargs';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHost from './BuildHost';


const io = new Io();


async function updateHost(hostConfig: PreHostConfig, buildDir: string, tmpDir: string) {
  const buildHost: BuildHost = new BuildHost(hostConfig, buildDir, tmpDir, io);

  console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
  await buildHost.build();

  const updateHost: UpdateHost = new UpdateHost(hostConfig, buildDir, tmpDir, io);

  console.info(`===> updating host "${hostConfig.id}"`);
  await updateHost.update();
}


export default async function commandUpdate() {
  let hostName: string | undefined;
  let groupConfigPath: string;

  // specified only group config
  if (yargs.argv._[1] && !yargs.argv._[2]) {
    groupConfigPath = yargs.argv._[1];
  }
  // specified host name and group config
  else if (yargs.argv._[1] && yargs.argv._[2]) {
    hostName = yargs.argv._[1];
    groupConfigPath = yargs.argv._[2];
  }
  else {
    throw new Error(`You should specify a group config path`);
  }

  const groupConfig: GroupConfigParser = new GroupConfigParser(groupConfigPath, io);

  await groupConfig.init();

  // clear whole tmp dir
  await io.rimraf(`${groupConfig.tmpDir}/**/*`);

  // update only specified host
  if (hostName) {
    if (!groupConfig.hosts[hostName]) {
      throw new Error(`Can't find host "${hostName}" in group config`);
    }

    await updateHost(groupConfig.hosts[hostName], groupConfig.buildDir, groupConfig.tmpDir);
  }
  // update all the hosts
  else {
    for (let currentHostName of Object.keys(groupConfig.hosts)) {
      await updateHost(groupConfig.hosts[currentHostName], groupConfig.buildDir, groupConfig.tmpDir);
    }
  }

}
