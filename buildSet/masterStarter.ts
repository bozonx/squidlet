import {
  getPlatformSystem,
  readConfig,
} from './helpers';
import System from '../host/src/app/System';
import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';


/**
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
export function generateMasterConfigSet(main: Main): HostFilesSet {
  const hostId = 'master';
  return {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    config: main.masterConfig.getFinalHostConfig(hostId),
    entitiesSet: main.hostsFilesSet.generateSrcEntitiesSet(hostId),
  };
}

async function prepareHostSystem (main: Main): Promise<System> {
  console.info(`===> Initialize host system of platform`);
  console.info(`--> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: HostFilesSet = generateMasterConfigSet(main);
  const platformName: string = hostConfigSet.config.platform;
  console.info(`--> getting host system of platform`);
  const hostSystem: System = await getPlatformSystem(platformName);

  // integrate a config set as a static prop
  ConfigSetMaster.hostConfigSet = hostConfigSet;

  // register config set manager
  hostSystem.$registerConfigSetManager(ConfigSetMaster);

  return hostSystem;
}

export default async function init (resolvedConfigPath: string) {
  const config: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedConfigPath);
  const main: Main = new Main(config, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();

  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(true);

  const hostSystem: System = await prepareHostSystem(main);

  console.info(`===> Starting master host system`);
  await hostSystem.start();
}
