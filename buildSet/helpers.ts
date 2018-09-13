import * as path from 'path';

import x86 from '../platforms/squidlet-x86/index';
import rpi from '../platforms/squidlet-rpi/index';
import {loadYamlFile} from '../configWorks/IO';
import System from '../host/src/app/System';
import Main from '../configWorks/Main';
import {EntitiesSet} from '../configWorks/interfaces/EntitySet';
import {EntitiesNames, ManifestsTypePluralName} from '../configWorks/Entities';
import HostConfig from '../host/src/app/interfaces/HostConfig';
import DefinitionsSet from '../configWorks/interfaces/DefinitionsSet';


interface HostFilesSet extends DefinitionsSet {
  entitiesSet: EntitiesSet;
}

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
 * Generate master host config with integrated files set which points to original (ts or js) files
 */
export function generateMasterConfig(main: Main): HostConfig {
  const hostId = 'master';
  const hostConfig = main.hostsConfigSet.getHostConfig(hostId);
  const configSet: HostFilesSet = {
    ...main.hostsFilesSet.getDefinitionsSet(hostId),
    entitiesSet: generateSrcEntitiesSet(main, hostId),
  };

  return {
    ...hostConfig,
    config: {
      ...hostConfig.config,
      params: {
        ...hostConfig.config.params,
        configSet,
      }
    }
  };
}


////// Private

/**
 * Get set of entities of specified host
 */
function generateSrcEntitiesSet(main: Main, hostId: string): EntitiesSet {
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
