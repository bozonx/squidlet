import HostApp from '../host/src/app/System';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import ConfigSetManager from '../host/src/app/interfaces/ConfigSetManager';


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
