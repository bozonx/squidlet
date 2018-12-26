import {collectDevs, getMasterSysDev, readConfig} from './helpers';
import System from '../host/src/app/System';
import Main from '../configWorks/Main';
import {SrcHostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import PreMasterConfig from '../configWorks/interfaces/PreMasterConfig';


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

  const devsSet: {[index: string]: new (...params: any[]) => any} = collectDevs(platformName);
  const sysMasterDev = getMasterSysDev(platformName);

  // register config set
  (sysMasterDev as any).registerConfigSet(hostConfigSet);
  // replace Sys.dev to Sys.master.dev
  devsSet['Sys.dev'] = sysMasterDev;

  await hostSystem.$registerDevs(devsSet);

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
  const hostConfigSet: SrcHostFilesSet = generateMasterConfigSet(main);
  // prepare host app
  const hostSystem: System = await prepareHostApp(hostConfigSet);

  console.info(`===> Starting master host system`);
  await hostSystem.start();
}
