import {collectDevs, readConfig} from './helpers';
import System from '../host/src/app/System';
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

export async function prepareHostSystem (
  getPlatformSystem: (platformName: string) => Promise<System>,
  hostConfigSet: HostFilesSet,
): Promise<System> {
  console.info(`===> Initialize host system of platform`);

  const platformName: string = hostConfigSet.config.platform;

  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: System = new System();
  const devsSet: {[index: string]: new (...params: any[]) => any} = collectDevs(platformName);

  // TODO: replace master Sys.dev
  // TODO: подмененный Sys.dev должен отдать список других devs

  // console.info(`--> register platform's devs`);
  // await hostSystem.$registerDevs(devsSet);

  return hostSystem;
}


export default async function masterStarter (resolvedConfigPath: string) {
  const masterConfig: PreMasterConfig = await readConfig<PreMasterConfig>(resolvedConfigPath);

  // TODO: set buildDir

  const main: Main = new Main(masterConfig, resolvedConfigPath);

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();

  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(true);

  console.info(`===> generate master config object`);
  // generate master config js object with paths of master host configs and entities files
  const hostConfigSet: HostFilesSet = generateMasterConfigSet(main);
  const hostSystem: System = await prepareHostSystem(getPlatformSystem, hostConfigSet);

  console.info(`===> Starting master host system`);
  await hostSystem.start();
}
