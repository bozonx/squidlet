import * as path from 'path';

import x86 from '../../platforms/squidlet-x86';
import rpi from '../../platforms/squidlet-rpi';
import {loadYamlFile} from '../../configWorks/IO';
import System from '../../host/src/app/System';


// TODO: может не host config а какой-то свой
export type PlatformIndex = (hostConfig: {[index: string]: any}) => System;

export const platforms: {[index: string]: PlatformIndex} = {
  x86,
  rpi,
};



export function getPlatformSystem(platformName: string): System {
  if (!platforms[platformName]) {
    console.error(`You have to specify a "platform" params`);

    process.exit(3);
  }

  return platforms[platformName];
}

export function resolveConfigPath(pathToYamlFile?: string): string {
  if (!pathToYamlFile) {
    console.error(`You have to specify a "--config" param`);

    process.exit(3);
  }

  return path.resolve(process.cwd(), (pathToYamlFile as string));
}

export async function readConfig<T> (resolvedPath: string): Promise<T> {
  return await loadYamlFile(resolvedPath) as T;
}
