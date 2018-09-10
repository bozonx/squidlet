import * as path from 'path';

import x86 from '../platforms/squidlet-x86/index';
import rpi from '../platforms/squidlet-rpi/index';
import {loadYamlFile} from '../configWorks/IO';
import System from '../host/src/app/System';


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
