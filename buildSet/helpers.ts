import * as path from 'path';

import {loadYamlFile} from '../configWorks/IO';
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
const DEVS_DIR = 'dev';


export const platformConfigs: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};

export function resolveStorageDir(pathToDir?: string): string {
  if (!pathToDir) {
    throw new Error(`You have to specify a "--storage" param`);
  }

  return path.resolve(process.cwd(), (pathToDir as string));
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


export function getMasterSysDev(platformName: string): new (...params: any[]) => any {
  const platformDirName = `squidlet-${platformName}`;

  const devPath = path.join(platformsDir, platformDirName, DEVS_DIR, 'Sys.master.dev');

  return require(devPath).default;
}

export function collectDevs(platformName: string) {
  if (!platformConfigs[platformName]) {
    throw new Error(`Platform "${platformName}" haven't been found`);
  }

  const platformDevs: string[] = platformConfigs[platformName].devs;
  const devsSet: {[index: string]: new (...params: any[]) => any} = {};
  const platformDirName = `squidlet-${platformName}`;

  for (let devName of platformDevs) {
    const fullDevName = `${devName}`;
    const devPath = path.join(platformsDir, platformDirName, DEVS_DIR, fullDevName);

    devsSet[fullDevName] = require(devPath).default;
  }

  return devsSet;
}
