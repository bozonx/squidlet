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
import SrcHostEnvSet from '../hostEnvBuilder/interfaces/SrcHostEnvSet';
import {DevClass} from '../host/entities/DevManager';


const HOSTS_BUILD_DEFAULT_DIR = '../build/env';
// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;


async function prepareHostApp (hostConfigSet: SrcHostEnvSet): Promise<System> {
  const machine: string = hostConfigSet.configs.config.machine;

  console.info(`===> initializing host system on machine "${machine}"`);

  const hostSystem: System = new System();

  console.info(`--> register platform's devs`);

  const devsSet: {[index: string]: DevClass} = collectDevs(__dirname, machine);
  const sysMasterDev = getMasterSysDev(__dirname);

  // register config set
  (sysMasterDev as any).registerConfigSet(hostConfigSet);
  // replace Sys.dev to Sys.master.dev
  devsSet['Sys'] = sysMasterDev;

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

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: SrcHostEnvSet = envBuilder.generateSrcConfigSet();
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
