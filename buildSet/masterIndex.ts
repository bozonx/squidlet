import * as yargs from 'yargs';

import MasterConfig from '../configWorks/MasterConfig';
import {
  generateSrcEntitiesSet,
  getPlatformSystem,
  readConfig,
  resolveConfigPath
} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';


const debug: boolean = Boolean(yargs.argv.debug);


/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
export function generateMasterConfigSet(main: Main): HostFilesSet {
  const hostId = 'master';
  return {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getHostConfig(hostId),
    entitiesSet: generateSrcEntitiesSet(main, hostId),
  };
}

async function prepareHostSystem (main: Main): Promise<System> {
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: HostFilesSet = generateMasterConfigSet(main);
  const platformName: string = hostConfigSet.config.platform;
  const hostSystem: System = await getPlatformSystem(platformName);

  // integrate a config set
  ConfigSetMaster.hostConfigSet = hostConfigSet;

  // register config set manager
  hostSystem.$registerConfigSetManager(ConfigSetMaster);

  return hostSystem;
}


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
async function init () {
  const resolvedConfigPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedConfigPath);
  const main: Main = new Main(config, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();

  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(true);

  const hostSystem = await prepareHostSystem(main);

  // start master host system
  await hostSystem.start();
}

init()
  .catch((err) => {
    if (debug) {
      throw err;
    }
    else {
      console.error(err.toString());

      process.exit(3);
    }
  });
