import * as yargs from 'yargs';
import * as path from 'path';
import {promises as fsPromises} from 'fs';

import {collectDevs, resolveStorageDir} from './helpers';
import System from '../host/src/app/System';
import {DevClass} from '../host/src/app/entities/DevManager';


// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;
const resolvedStorageDir: string = resolveStorageDir(yargs.argv.storage);


async function init() {
  const hostConfigPath = path.join(resolvedStorageDir, 'configs/config.json');
  const hostConfig = JSON.parse(await fsPromises.readFile(hostConfigPath, {encoding: 'utf8'}));

  if (!hostConfig) {
    throw new Error(`Can't find host config "${hostConfigPath}"`);
  }

  console.info(`===> Initialize host system of platform`);

  const platformName: string = hostConfig.platform;

  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: System = new System();

  console.info(`--> register platform's devs`);

  const devsSet: {[index: string]: DevClass} = collectDevs(platformName);

  // set storage dir to Sys.dev
  (devsSet['Sys.dev'] as any).registerStorageDir(resolvedStorageDir);

  await hostSystem.$registerDevSet(devsSet);

  return hostSystem;
}


init()
  .catch((err) => {
    if (debug) {
      console.error(err);

      throw err;
    }
    else {
      console.error(err.toString());

      process.exit(3);
    }
  });
