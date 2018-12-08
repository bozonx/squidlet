import HostApp from '../host/src/app/System';
import ConfigSetSolid from '../host/src/app/config/ConfigSetSolid';
import {HostFilesSet} from '../host/src/app/interfaces/HostFilesSet';
import {prepareHostSystem} from './starterCommon';

// const debug = global.__DEBUG;

declare const platformDevSet: {[index: string]: new (...params: any[]) => any};
// built host config which includes platform' host config on the bottom level
declare const hostConfigSet: HostFilesSet;


async function getPlatformSystem(): Promise<HostApp> {
  const system: HostApp = new HostApp();

  console.info(`--> register platform's devs`);
  await system.$registerDevs(platformDevSet);

  return system;
}

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
