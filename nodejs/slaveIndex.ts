import * as yargs from 'yargs';
import * as path from 'path';
import {promises as fsPromises} from 'fs';

import {collectDevs} from '../helpers/buildHelpers';
import System from '../host/System';
import {DevClass} from '../host/entities/DevManager';


// TODO: change
//const debug: boolean = Boolean(yargs.argv.debug);
const debug = true;


if (!yargs.argv.storage) {
  throw new Error(`You have to specify a "--storage" param`);
}


const resolvedStorageDir: string = path.resolve(process.cwd(), yargs.argv.storage as string);


async function init() {
  const hostConfigPath = path.join(resolvedStorageDir, 'configs/config.json');
  let hostConfigContent: string;

  try {
    hostConfigContent = await fsPromises.readFile(hostConfigPath, {encoding: 'utf8'});
  }
  catch (err) {
    throw new Error(`Can't find host config "${hostConfigPath}"`);
  }

  const hostConfig = JSON.parse(hostConfigContent);
  const platformName: string = hostConfig.platform;

  console.info(`===> Initialize host system of platform`);
  console.info(`--> getting host system of platform "${platformName}"`);

  const hostSystem: System = new System();

  console.info(`--> register platform's devs`);

  const devsSet: {[index: string]: DevClass} = collectDevs(platformName);

  // set storage dir to Sys.dev
  (devsSet['SysDev.dev'] as any).registerStorageDir(resolvedStorageDir);

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
