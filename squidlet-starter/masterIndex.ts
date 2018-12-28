/**
 * master:
 * * receives master config
 * * generate all the host files
 * * generate master config set include parsed config, paths to entities and configs and platform config
 * * passes it to platform index file and runs host system as is, without building
 */

import {collectDevs, getMasterSysDev, initConfigWorks, resolveParam} from './helpers';
import System from '../host/src/app/System';
import Main from './buildHostEnv/Main';
import {SrcHostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import {DevClass} from '../host/src/app/entities/DevManager';


// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;


/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
export function generateMasterConfigSet(main: Main): SrcHostFilesSet {
  const hostId = 'master';

  return {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getFinalHostConfig(hostId),
    entitiesSet: main.hostsFilesSet.generateSrcEntitiesSet(hostId),
  };
}

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
  const resolvedConfigPath: string = resolveParam('CONFIG', 'config');

  const resolvedBuildDir: string | undefined = process.env.BUILD_DIR as string;

  // TODO: wtf - не работает

  //const resolvedBuildDir: string | undefined = process.env.BUILD_DIR || yargs.argv['build-dir'];

  const main: Main = await initConfigWorks(resolvedConfigPath, resolvedBuildDir, true);

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: SrcHostFilesSet = generateMasterConfigSet(main);
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
