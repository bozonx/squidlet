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
  resolveParam,
  resolveParamRequired
} from './starter/buildHelpers';
import System from '../../system/System';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import {DevClass} from '../../system/entities/DevManager';

import EnvSetMemory from '../../hostEnvBuilder/EnvSetMemory';


declare const global: {
  __HOST_CONFIG_SET: HostEnvSet;
};

const HOSTS_BUILD_DEFAULT_DIR = '../build/env';
// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;


function prepareHostApp (hostConfigSet: HostEnvSet): System {
  console.info(`--> making platform's dev set`);

  const machine: string = hostConfigSet.configs.config.machine;
  const devsSet: {[index: string]: DevClass} = collectDevs(hostConfigSet.configs.config.platform, machine);

  console.info(`===> initializing host system on machine "${machine}"`);

  EnvSetMemory.$registerConfigSet(hostConfigSet);

  return new System(devsSet, {}, EnvSetMemory);
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
  const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();
  // prepare host app
  const hostSystem: System = prepareHostApp(hostEnvSet);

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
