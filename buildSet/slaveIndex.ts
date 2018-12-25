import * as yargs from 'yargs';
import * as path from 'path';
import {promises as fsPromises} from 'fs';

import {collectDevs, resolveStorageDir} from './helpers';
import System from '../host/src/app/System';


const debug: boolean = Boolean(yargs.argv.debug);
const resolvedStorageDir: string = resolveStorageDir(yargs.argv.storage);


async function init() {
  const hostConfigPath = path.join(resolvedStorageDir, 'configs/config.json');
  const hostConfig = JSON.parse(await fsPromises.readFile(hostConfigPath, {encoding: 'utf8'}));

  console.info(`===> Initialize host system of platform`);

  const platformName: string = hostConfig.platform;

  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: System = new System();

  console.info(`--> register platform's devs`);

  const devsSet: {[index: string]: new (...params: any[]) => any} = collectDevs(platformName);

  // set storage dir to Sys.dev
  (devsSet['Sys.dev'] as any).registerStorageDir(resolvedStorageDir);

  await hostSystem.$registerDevs(devsSet);

  return hostSystem;
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
