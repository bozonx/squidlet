import * as yargs from 'yargs';

import MasterConfig from '../../configWorks/MasterConfig';
import generateMasterSet from './generateMasterSet';
import {getPlatformSystem, readConfig, resolveConfigPath} from './helpers';
import buildHostsConfigs from './buildHostsConfigs';
import System from '../../host/src/app/System';
import ConfigSetMaster from '../../host/src/app/config/ConfigSetMaster';


// master:
// * receives master config
// * generate all the host files
// * generate master config set include parsed config, paths to entities and configs and platform config
// * passes it to platform index file and runs host system as is, without building
export default async function () {
  const resolvedPath: string = resolveConfigPath(yargs.argv.config);
  const config: MasterConfig = await readConfig<MasterConfig>(resolvedPath);

  console.info(`===> Making configs and entities files of all the hosts`);
  await buildHostsConfigs(config);
  // generate master config js object with paths of master host configs and entities files
  const masterSet = await generateMasterSet(config);
  const platformName: string = masterSet.platform;
  const hostSystem: System = getPlatformSystem(platformName);
  const configSetManager = new ConfigSetMaster(masterSet);
  // register config set manager
  hostSystem.$registerConfigSetManager(configSetManager);
  // start master host system
  hostSystem.start();
}
