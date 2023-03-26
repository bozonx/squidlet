import HostApp from '../../host/src/app/System';
import ConfigSetSolid from '../../host/src/app/config/ConfigSetSolid';
import {HostFilesSet} from '../../host/src/app/interfaces/HostFilesSet';
import {prepareHostSystem} from '../../buildSet/starterCommon';

// const debug = global.__DEBUG;

declare const __PLATFORM_DEVS_SET: {[index: string]: new (...params: any[]) => any};
// built host config which includes platform' host config on the bottom level
declare const __HOST_CONFIG_SET: HostFilesSet;


async function getPlatformSystem(): Promise<HostApp> {
  const system: HostApp = new HostApp();

  console.info(`--> register platform's devs`);
  await system.$registerDevs(__PLATFORM_DEVS_SET);

  return system;
}

async function init () {
  const hostSystem: HostApp = await prepareHostSystem(getPlatformSystem, __HOST_CONFIG_SET, ConfigSetSolid);

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
