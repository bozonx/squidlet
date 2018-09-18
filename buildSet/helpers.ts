import * as path from 'path';

import {loadYamlFile} from '../configWorks/IO';
import System from '../host/src/app/System';
import Main from '../configWorks/Main';
import {EntitiesSet} from '../configWorks/interfaces/EntitySet';
import {EntitiesNames, ManifestsTypePluralName} from '../configWorks/Entities';
import platform_esp32 from '../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../platforms/squidlet-x86/platform_x86_linux';
import PlatformConfig from '../configWorks/interfaces/PlatformConfig';
import {
  PLATFORM_ESP32,
  PLATFORM_ESP8266,
  PLATFORM_RPI,
  PLATFORM_X86
} from '../configWorks/interfaces/Platforms';


const platformsDir = path.resolve(__dirname, '../platforms');

export const platforms: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};


export async function getPlatformSystem(platformName: string): Promise<System> {
  if (!platforms[platformName]) {
    throw new Error(`Platform "${platformName}" haven't been found`);
  }

  const system: System = new System();
  const devsSet: {[index: string]: new (...params: any[]) => any} = collectDevs(platformName);

  await system.$registerDevs(devsSet);

  return system;
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

  // TODO: move to HostsFilesSet

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

  // TODO: move to HostsFilesSet
  // TODO: make requireJs paths

  return result;
}


function collectDevs(platformName: string) {
  const platformDevs: string[] = platforms[platformName].devs;
  const devsSet: {[index: string]: new (...params: any[]) => any} = {};
  const platformDirName = `squidlet-${platformName}`;

  for (let devName of platformDevs) {
    const fullDevName = `${devName}.dev`;
    const devPath = path.join(platformsDir, platformDirName, 'dev', fullDevName);

    devsSet[fullDevName] = require(devPath);
  }

  return devsSet;
}
