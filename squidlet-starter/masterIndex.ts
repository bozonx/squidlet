/**
 * master:
 * * receives master config
 * * generate all the host files
 * * generate master config set include parsed config, paths to entities and configs and platform config
 * * passes it to platform index file and runs host system as is, without building
 */

import * as path from 'path';

import {collectDevs, getMasterSysDev, HOSTS_BUILD_DEFAULT_DIR, resolveParam, resolveParamRequired} from './helpers';
import System from '../squidlet-core/core/System';
import MainHostsEnv from './buildHostEnv/MainHostsEnv';
import {SrcHostFilesSet} from '../squidlet-core/core/interfaces/HostFilesSet';
import {DevClass} from '../squidlet-core/core/entities/DevManager';


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

  const mainHostsEnv: MainHostsEnv = new MainHostsEnv(absMasterConfigPath, absBuildDir);

  console.info(`===> generate hosts env files and configs`);

  await mainHostsEnv.collect();
  await mainHostsEnv.write(true);

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: SrcHostFilesSet = mainHostsEnv.generateMasterConfigSet();
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
