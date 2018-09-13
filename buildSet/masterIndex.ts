import * as yargs from 'yargs';

import MasterConfig from '../configWorks/MasterConfig';
import {generateMasterConfig, getPlatformSystem, readConfig, resolveConfigPath} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import ConfigSetManager from '../host/src/app/interfaces/ConfigSetManager';


const debug: boolean = Boolean(yargs.argv.debug);


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

  // generate master config js object with paths of master host configs and entities files
  const masterHostConfig: HostConfig = generateMasterConfig(main);
  const platformName: string = masterHostConfig.platform;
  const hostSystem: System = getPlatformSystem(platformName);
  const configSetManager: ConfigSetManager = new ConfigSetMaster(masterHostConfig);
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
