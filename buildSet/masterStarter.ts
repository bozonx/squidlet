import {getPlatformSystem, readConfig} from './helpers';
import HostApp from '../host/src/app/System';
//import ConfigSetMaster from '../host/src/app/config/ConfigSetMaster';
import Main from '../configWorks/Main';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';
//import ConfigSetManager from '../host/src/app/interfaces/ConfigSetManager';


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

export async function prepareHostSystem (
  getPlatformSystem: (platformName: string) => Promise<HostApp>,
  hostConfigSet: HostFilesSet,
  ConfigSetManager: new (system: HostApp) => ConfigSetManager
): Promise<HostApp> {
  console.info(`===> Initialize host system of platform`);

  const platformName: string = hostConfigSet.config.platform;

  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: HostApp = await getPlatformSystem(platformName);

  // integrate a config set as a static prop
  (ConfigSetManager as {[index: string]: any}).hostConfigSet = hostConfigSet;

  // register config set manager
  hostSystem.$registerConfigSetManager(ConfigSetManager);

  return hostSystem;
}


export default async function masterStarter (resolvedConfigPath: string) {
  const masterConfig: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedConfigPath);
  const main: Main = new Main(masterConfig, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();

  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(true);

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: HostFilesSet = generateMasterConfigSet(main);
  const hostSystem: HostApp = await prepareHostSystem(getPlatformSystem, hostConfigSet, ConfigSetMaster);

  console.info(`===> Starting master host system`);
  await hostSystem.start();
}
