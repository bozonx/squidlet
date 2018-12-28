import * as path from 'path';
import * as yargs from 'yargs';
import * as shelljs from 'shelljs';
import * as dependencyTree from 'dependency-tree';

import {loadYamlFile} from './buildHostEnv/IO';
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
import {DevClass} from '../host/src/app/entities/DevManager';
import Main from './buildHostEnv/Main';


interface BuildConfig {
  buildDir: string;
  compiledTsDir: string;
  compiledJsDir: string;
  hostRoot: string;
  minPrjDir: string;
  minDepsDir: string;
  flashDir: string;
  srcDir: string;
  dependenciesBuildDir: string;
  mainJsFileName: string;
  bundleFile: string;
  prjConfigYaml: string;
  bootrstPath: string;
  strictMode?: boolean;
}


const platformsDir = path.resolve(__dirname, '../platforms');
const DEVS_DIR = 'dev';


export const platformConfigs: {[index: string]: PlatformConfig} = {
  [PLATFORM_ESP32]: platform_esp32,
  [PLATFORM_ESP8266]: platform_esp8266,
  [PLATFORM_RPI]: platform_rpi,
  [PLATFORM_X86]: platform_x86_linux,
};



export function clearDir(dirName: string) {
  shelljs.rm('-rf', path.join(dirName, '*'));
}

export function makeEnvConfig(envPrjConfig: {[index: string]: any}, envConfigPath: string): BuildConfig {
  const envConfigBaseDir = path.dirname(envConfigPath);
  const buildDir = path.resolve(envConfigBaseDir, envPrjConfig.dst);

  return {
    buildDir,
    srcDir: path.resolve(envConfigBaseDir, envPrjConfig.src),
    prjConfigYaml: path.resolve(envConfigBaseDir, envPrjConfig.prjConfig),
    compiledTsDir: path.join(buildDir, 'compiled-ts'),
    compiledJsDir: path.join(buildDir, 'compiled-js'),
    hostRoot: 'system/host',
    minPrjDir: path.join(buildDir, 'minPrj'),
    minDepsDir: path.join(buildDir, 'minDeps'),
    flashDir: path.join(buildDir, 'flash'),
    dependenciesBuildDir: path.join(buildDir, 'deps'),
    mainJsFileName: `${envPrjConfig.main}.js`,
    bundleFile: path.join(buildDir, 'bundle.js'),
    bootrstPath: path.join(__dirname, '.bootrst'),
    strictMode: envPrjConfig.strictMode,
  };
}

export function resolveStorageDir(pathToDir?: string): string {
  if (!pathToDir) {
    throw new Error(`You have to specify a "--storage" param`);
  }

  return path.resolve(process.cwd(), (pathToDir as string));
}

export function resolveParam(envParamName: string, argParamName?: string): string {
  let value: string | undefined;

  if (process.env[envParamName]) {
    value = process.env.CONFIG;
  }
  else if (argParamName && yargs.argv[argParamName]) {
    value = yargs.argv.config;
  }
  else {
    throw new Error(`You have to specify env variable ${envParamName}=... or argument --${argParamName}=...`);
  }

  return value as string;
}

export async function readConfig<T> (resolvedPath: string): Promise<T> {
  return await loadYamlFile(resolvedPath) as T;
}


export function getMasterSysDev(platformName: string): DevClass {
  const platformDirName = `squidlet-${platformName}`;

  const devPath = path.join(platformsDir, platformDirName, DEVS_DIR, 'Sys.master.dev');

  return require(devPath).default;
}

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

export async function initConfigWorks(relMasterConfigPath: string, relBuildDir?: string, skipMaster?: boolean): Promise<Main> {
  const absMasterConfigPath: string = path.resolve(process.cwd(), relMasterConfigPath);
  const absBuildDir: string | undefined = relBuildDir && path.resolve(process.cwd(), relBuildDir);

  const main: Main = new Main(absMasterConfigPath, absBuildDir);

  await main.init();

  console.info(`===> Collecting configs and entities files of all the hosts`);
  await main.collect();

  // write all the hosts and entities files exclude master's host files
  await main.writeToStorage(skipMaster);

  return main;
}
