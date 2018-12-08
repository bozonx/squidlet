import HostApp from '../host/src/app/System';
import ConfigSetSolid from '../host/src/app/config/ConfigSetSolid';
import PlatformConfig from '../configWorks/interfaces/PlatformConfig';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import {prepareHostSystem} from './starterCommon';

// const debug = global.__DEBUG;
// const SystemClass = System.import('host/src/System');
// const hostConfigSet = global.__HOST_CONFIG_SET;
// const ConfigSetManager = global.__HOST_CONFIG_SET_MANAGER;

declare const platformConfig: PlatformConfig;
// TODO: generate solid host config (not master)
declare const hostConfigSet: HostFilesSet;


async function getPlatformSystem(platformName: string): Promise<HostApp> {
  const system: HostApp = new HostApp();
  //const devsSet: {[index: string]: new (...params: any[]) => any} = collectDevs(platformName);

  // TODO: collect devs

  console.info(`--> register platform's devs`);
  //await system.$registerDevs(devsSet);

  return system;
}

// async function prepareHostSystem1111() {
//   console.info(`===> Initialize host system of platform`);
//
//   const platformName: string = hostConfigSet.config.platform;
//   console.info(`--> getting host system of platform "${platformName}"`);
//   // make a system instance
//   const hostSystem: HostApp = await getPlatformSystem(platformConfig);
//
//   // integrate a config to config set manager
//   ConfigSetSolid.hostConfigSet = hostConfigSet;
//
//   // register config set manager
//   hostSystem.$registerConfigSetManager(ConfigSetSolid);
//
//   return hostSystem;
// }

async function init () {
  const hostSystem: HostApp = await prepareHostSystem(getPlatformSystem, hostConfigSet, ConfigSetSolid);

  await hostSystem.start();
}

init()
  .catch((err) => {
    // if (debug) {
    //   throw err;
    // }
    // else {
    //   console.error(err.toString());
    //
    //   process.exit(3);
    // }

    console.error(String(err));

    process.exit(3);
  });
