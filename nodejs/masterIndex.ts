/**
 * master:
 * * receives master config
 * * generate all the host files
 * * generate master config set include parsed config, paths to entities and configs and platform config
 * * passes it to platform index file and runs host system as is, without building
 */

import * as path from 'path';

import {
  collectDevs,
  getMasterSysDev,
  resolveParam,
  resolveParamRequired
} from '../helpers/buildHelpers';
import System from '../host/System';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import {SrcHostFilesSet} from '../host/interfaces/HostFilesSet';
import {DevClass} from '../host/entities/DevManager';


export const HOSTS_BUILD_DEFAULT_DIR = '../build/env';
// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;


export async function prepareHostApp (hostConfigSet: SrcHostFilesSet): Promise<System> {
  console.info(`===> Initialize host system of platform`);

  const platformName: string = hostConfigSet.config.platform;

  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: System = new System();

  console.info(`--> register platform's devs`);

  const devsSet: {[index: string]: DevClass} = collectDevs(platformName);
  const sysMasterDev = getMasterSysDev(platformName);

  // register config set
  (sysMasterDev as any).registerConfigSet(hostConfigSet);
  // replace Sys.dev to Sys.master.dev
  devsSet['Sys.dev'] = sysMasterDev;

  await hostSystem.$registerDevSet(devsSet);

  return hostSystem;
}


async function masterStarter () {
  const resolvedConfigPath: string = resolveParamRequired('CONFIG', 'config');
  const resolvedBuildDir: string | undefined = resolveParam('BUILD_DIR', 'build-dir');
  const absMasterConfigPath: string = path.resolve(process.cwd(), resolvedConfigPath);
  let absBuildDir: string;

  if (resolvedBuildDir) {
    absBuildDir = path.resolve(process.cwd(), resolvedBuildDir);
  }
  else {
    absBuildDir = path.resolve(process.cwd(), HOSTS_BUILD_DEFAULT_DIR);
  }

  // make env builder instance
  const envBuilder: EnvBuilder = new EnvBuilder(absMasterConfigPath, absBuildDir);

  console.info(`===> generate hosts env files and configs`);

  await envBuilder.collect();
  // TODO: не делать write
  //await envBuilder.write(true);

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: SrcHostFilesSet = envBuilder.generateMasterConfigSet();
  // prepare host app
  const hostSystem: System = await prepareHostApp(hostConfigSet);

  console.info(`===> Starting master host system`);

  await hostSystem.start();
}


masterStarter()
  .catch((err) => {
    if (debug) {
      console.error(err);

      throw err;
    }
    else {
      console.error(err.toString());

      process.exit(3);
    }
  });
