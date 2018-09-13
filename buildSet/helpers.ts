import * as path from 'path';

import x86 from '../platforms/squidlet-x86/index';
import rpi from '../platforms/squidlet-rpi/index';
import {loadYamlFile} from '../configWorks/IO';
import System from '../host/src/app/System';
import Main from '../configWorks/Main';
import {SrcEntitiesSet} from '../configWorks/interfaces/EntitySet';
import {EntitiesNames, ManifestsTypePluralName} from '../configWorks/Entities';


export type PlatformIndex = () => System;

export const platforms: {[index: string]: PlatformIndex} = {
  x86,
  rpi,
};


export function getPlatformSystem(platformName: string): System {
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
export function generateSrcEntitiesSet(main: Main, hostId: string): SrcEntitiesSet {
  const result: SrcEntitiesSet = {
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
