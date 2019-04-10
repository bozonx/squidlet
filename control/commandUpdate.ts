import * as yargs from 'yargs';
import * as path from 'path';

import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import UpdateHost from './UpdateHost';
import GroupConfigParser from './GroupConfigParser';
import Io from '../hostEnvBuilder/Io';
import BuildHost from './BuildHost';
import UpdateCommandParams from './interfaces/UpdateCommandParams';


const io = new Io();


async function updateHost(hostConfig: PreHostConfig, buildDir: string, tmpDir: string) {
  const buildHost: BuildHost = new BuildHost(hostConfig, buildDir, tmpDir, io);

  console.info(`===> generating configs and entities of host "${hostConfig.id}"`);
  await buildHost.build();

  const updateHost: UpdateHost = new UpdateHost(hostConfig, buildDir, tmpDir, io);

  console.info(`===> updating host "${hostConfig.id}"`);
  await updateHost.update();
}

function resolveParams(): UpdateCommandParams {
  let hostName: string | undefined;
  let groupConfigPath: string;
  let buildDir: string | undefined = process.env.BUILD_DIR || <string>yargs.argv['build-dir'];
  let tmpDir: string | undefined = process.env.TMP_DIR || <string>yargs.argv['tmp-dir'];

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

  // resolve relative buildDir
  if (buildDir) buildDir = path.resolve(process.cwd(), buildDir);
  // resolve relative tmpDir
  if (tmpDir) tmpDir = path.resolve(process.cwd(), tmpDir);

  return {
    hostName,
    groupConfigPath,
    buildDir,
    tmpDir,
  };
}

export default async function commandUpdate() {
  const params: UpdateCommandParams = resolveParams();
  const groupConfig: GroupConfigParser = new GroupConfigParser(
    io,
    params.groupConfigPath,
    params.buildDir,
    params.tmpDir
  );

  await groupConfig.init();
  // clear whole tmp dir
  await io.rimraf(`${groupConfig.tmpDir}/**/*`);

  // update only specified host
  if (params.hostName) {
    if (!groupConfig.hosts[params.hostName]) {
      throw new Error(`Can't find host "${params.hostName}" in group config`);
    }

    await updateHost(groupConfig.hosts[params.hostName], groupConfig.buildDir, groupConfig.tmpDir);
  }
  // update all the hosts
  else {
    for (let currentHostName of Object.keys(groupConfig.hosts)) {
      await updateHost(groupConfig.hosts[currentHostName], groupConfig.buildDir, groupConfig.tmpDir);
    }
  }

}
