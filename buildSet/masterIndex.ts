import * as yargs from 'yargs';

import MasterConfig from '../configWorks/MasterConfig';
import {getPlatformSystem, readConfig, resolveConfigPath} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import HostConfig from '../host/src/app/interfaces/HostConfig';


const debug: boolean = Boolean(yargs.argv.debug);


/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
function generateMasterConfig(main: Main): HostConfig {
  const hostId = 'master';
  const hostConfig = main.hostsConfigSet.getHostConfig(hostId);

  return {
    ...hostConfig,
    config: {
      ...hostConfig.config,
      params: {
        ...hostConfig.config.params,
        configSet: {
          ...main.hostsFilesSet.getDefinitionsSet(hostId),
          ...main.hostsFilesSet.getOriginalEntitiesSet(hostId),
        }
      }
    }
  };
}


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
async function init () {
  const resolvedConfigPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedConfigPath);
  const configWorks: Main = new Main(config, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await configWorks.collect();
  // write all the hosts and entities files
  await configWorks.writeAll();

  // generate master config js object with paths of master host configs and entities files
  const masterHostConfig: HostConfig = generateMasterConfig(configWorks);
  const platformName: string = masterHostConfig.platform;
  const hostSystem: System = getPlatformSystem(platformName);
  const configSetManager = new ConfigSetMaster(masterHostConfig);
  // register config set manager
  hostSystem.$registerConfigSetManager(configSetManager);
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
