import * as path from 'path';

import {loadYamlFile} from '../configWorks/IO';
import System from '../host/src/app/System';
import Main from '../configWorks/Main';
import {EntitiesSet} from '../configWorks/interfaces/EntitySet';
import {EntitiesNames, ManifestsTypePluralName} from '../configWorks/Entities';
import GpioDev from '../platforms/squidlet-rpi/dev/Gpio.dev';
import I2cMasterDev from '../platforms/squidlet-rpi/dev/I2cMaster.dev';
import FsDev from '../platforms/squidlet-rpi/dev/Fs.dev';


export type PlatformIndex = () => Promise<System>;


export const platforms: {[index: string]: PlatformIndex} = {
  x86,
  rpi,
};


export function getPlatformSystem(platformName: string): Promise<System> {
  if (!platforms[platformName]) {
    throw new Error(`Platform "${platformName}" haven't been found`);
  }

  return platforms[platformName]();
}

export function resolveConfigPath(pathToYamlFile?: string): string {
  if (!pathToYamlFile) {
    throw new Error(`You have to specify a "--config" param`);
  }

  return path.resolve(process.cwd(), (pathToYamlFile as string));
}

export async function readConfig<T> (resolvedPath: string): Promise<T> {
  return await loadYamlFile(resolvedPath) as T;
}


/**
 * Get set of entities of specified host
 */
export function generateSrcEntitiesSet(main: Main, hostId: string): EntitiesSet {
  const result: EntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  const usedEntitiesNames: EntitiesNames = main.hostsFilesSet.getEntitiesNames(hostId);

  const collect = (pluralType: ManifestsTypePluralName, classes: string[]) => {
    for (let className of classes) {
      const srcDir = main.entities.getSrcDir(pluralType, className);
      const relativeMain: string | undefined = main.entities.getMainFilePath(pluralType, className);
      const relativeFiles: string[] = main.entities.getFiles(pluralType, className);

      result[pluralType][className] = {
        manifest: main.entities.getManifest(pluralType, className),
        main: relativeMain && path.resolve(srcDir, relativeMain),
        files: relativeFiles.map((relativeFileName: string) => path.resolve(srcDir, relativeFileName)),
      };
    }
  };

  collect('devices', usedEntitiesNames.devices);
  collect('drivers', usedEntitiesNames.drivers);
  collect('services', usedEntitiesNames.services);

  return result;
}

export function generateDstEntitiesSet(main: Main, hostId: string): EntitiesSet {
  const result: EntitiesSet = {
    devices: {},
    drivers: {},
    services: {},
  };

  // TODO: make requireJs paths

  return result;
}


export async function platformWrapper(): Promise<System> {
  const system: System = new System();

  await system.$registerDevs({
    'Gpio.dev': GpioDev,
    'I2cMaster.dev': I2cMasterDev,
    'Fs.dev': FsDev,
  });

  return system;
}
