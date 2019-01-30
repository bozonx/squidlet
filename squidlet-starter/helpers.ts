import * as path from 'path';
import * as yargs from 'yargs';
import * as shelljs from 'shelljs';

import platform_esp32 from '../platforms/squidlet-esp32/platform_esp32';
import platform_esp8266 from '../platforms/squidlet-esp8266/platform_esp8266';
import platform_rpi from '../platforms/squidlet-rpi/platform_rpi';
import platform_x86_linux from '../platforms/squidlet-x86/platform_x86_linux';
import PlatformConfig from './buildHostEnv/interfaces/PlatformConfig';
import {
  PLATFORM_ESP32,
  PLATFORM_ESP8266,
  PLATFORM_RPI,
  PLATFORM_X86
} from './buildHostEnv/interfaces/Platforms';
import {DevClass} from '../squidlet-core/core/entities/DevManager';


// TODO: review
interface BuildConfig {
  buildDir: string;
  compiledTsDir: string;
  compiledJsDir: string;
  hostRoot: string;
  minPrjDir: string;
  minDepsDir: string;
  srcDir: string;
  mainJsFileName: string;
  strictMode?: boolean;
  //dependenciesBuildDir: string;
  //prjConfigYaml: string;
}


const platformsDir = path.resolve(__dirname, '../platforms');
const DEVS_DIR = 'dev';
export const HOSTS_BUILD_DEFAULT_DIR = '../build/env';
export const ENTITIES_BUILD_DEFAULT_DIR = '../build/entities';


export const platformConfigs: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};


export function getMasterSysDev(platformName: string): DevClass {
  const platformDirName = `squidlet-${platformName}`;
  const devPath = path.join(platformsDir, platformDirName, DEVS_DIR, 'Sys.master.dev');

  return require(devPath).default;
}

export function clearDir(dirName: string) {
  shelljs.rm('-rf', path.join(dirName, '*'));
}

export function makeEnvConfig(envPrjConfig: {[index: string]: any}, envConfigPath: string): BuildConfig {
  const envConfigBaseDir = path.dirname(envConfigPath);
  const buildDir = path.resolve(envConfigBaseDir, envPrjConfig.dst);

  return {
    buildDir,
    srcDir: path.resolve(envConfigBaseDir, envPrjConfig.src),
    compiledTsDir: path.join(buildDir, 'compiled-ts'),
    compiledJsDir: path.join(buildDir, 'compiled-js'),
    hostRoot: 'system/host',
    minPrjDir: path.join(buildDir, 'minPrj'),
    minDepsDir: path.join(buildDir, 'minDeps'),
    mainJsFileName: `${envPrjConfig.main}.js`,
    strictMode: envPrjConfig.strictMode,
    //dependenciesBuildDir: path.join(buildDir, 'deps'),
    //prjConfigYaml: path.resolve(envConfigBaseDir, envPrjConfig.prjConfig),
  };
}

export function resolveParamRequired(envParamName: string, argParamName?: string): string {
  const resolved: string | undefined = resolveParam(envParamName, argParamName);

  if (resolved) return resolved;

  throw new Error(`You have to specify env variable ${envParamName}=... or argument --${argParamName}=...`);
}

export function resolveParam(envParamName: string, argParamName?: string): string | undefined {
  if (process.env[envParamName]) {
    return process.env.CONFIG;
  }

  else if (argParamName && yargs.argv[argParamName]) {
    return yargs.argv.config as string;
  }

  return;
}

/**
 * Make devs collection in memory like {"Digital.dev": DevClass}
 */
export function collectDevs(platformName: string): {[index: string]: DevClass} {
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


// export async function readConfig<T> (resolvedPath: string): Promise<T> {
//   return await loadYamlFile(resolvedPath) as T;
// }
