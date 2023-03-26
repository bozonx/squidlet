import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/Platforms.js';
import Os, {SpawnCmdResult} from '../../../../../../../../mnt/disk2/workspace/squidlet/__old/shared/helpers/Os.js';
import NodejsMachines from '../../../../squidlet-networking/src/io/nodejs/interfaces/NodejsMachines';
import {callPromised} from '../../../../squidlet-lib/src/common';
import {ENCODE} from '../../../../squidlet-lib/src/constants';


export const REPO_ROOT = path.resolve(__dirname, '../../');
export const SYSTEM_DIR = path.join(REPO_ROOT, 'system');
export const SQUIDLET_PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');


/**
 * Concat arrays but not create a new one.
 * It mutates the srcArr.
 */
export function appendArray<T>(srcArr: T[], arrToAppend?: T[]) {
  if (!arrToAppend) return;

  for (let item of arrToAppend) srcArr.push(item);
}

// TODO: не используется
/**
 * Replace values if array.
 * It mutates an "arrToUpdate" array.
 */
export function updateArray(arrToUpdate: any[], newValues: any[]): void {
  for (let index in newValues) arrToUpdate[index] = newValues[index];
}

/**
 * Make platforms name from platforms path without extension.
 * E.g "/path/to/file.ts" -> "file"
 */
export function getFileNameOfPath(pathToIo: string): string {
  const parsed = path.parse(pathToIo);

  if (!parsed.name) throw new Error(`Can't parse io name of path "${pathToIo}"`);

  return parsed.name;
}

export function resolvePlatformDir(platform: Platforms): string {
  return path.join(REPO_ROOT, 'platforms', platform);
}

export function loadMachineConfigInPlatformDir(os: Os, platformDir: string, machine: string): MachineConfig {
  const machineConfigPath = path.join(platformDir, `machine-${machine}`);

  return os.require(machineConfigPath).default;
}


// TODO: test

/**
 * Call cb on SIGTERM and SIGINT signals
 */
export function listenScriptEnd(cb: () => Promise<void>) {
  const cbWrapper = () => {
    return cb()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);

        process.exit(2);
      });
  };

  process.on('SIGTERM', () => {
    console.info('SIGTERM signal has been caught');

    return cbWrapper();
  });

  process.on('SIGINT', () => {
    console.info('SIGINT signal has been caught');

    return cbWrapper();
  });
}

export function removeExtFromFileName(filename: string): string {
  const splat: string[] = filename.split('.');

  if (splat.length <= 1) return filename;

  return splat.slice(0, -1).join('.');
}

export async function makeFileCheckSum(filePath: string, sumFilePath: string) {
  const bundleContent: string = await callPromised(fs.readFile, filePath);
  const sum: string = crypto
    .createHash('md5')
    .update(bundleContent, ENCODE)
    .digest('hex');

  await callPromised(fs.writeFile, sumFilePath, sum, ENCODE);
}

// /**
//  * Make list of platforms names from list of platforms paths.
//  * E.g ['/path/to/file1.ts', '/path/file2'] -> ['file1', 'file2']
//  */
// export function makeListOfNamesFromPaths(paths: string[]): string[] {
//   return paths.map((item) => getFileNameOfPath(item));
// }

// export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
//   const platformDir: string = resolvePlatformDir(platform);
//   const machineConfigPath = path.join(platformDir, `machine-${machine}`);
//
//   return require(machineConfigPath).default;
// }

// /**
//  * Run command and don't print stdout if it returns code 0
//  */
// export async function runCmd(os: Os, cmd: string, cwd: string) {
//   // TODO: use uid, gid
//   const result: SpawnCmdResult = await os.spawnCmd(cmd, cwd);
//
//   if (result.status) {
//     console.error(`ERROR: npm ends with code ${result.status}`);
//     console.error(result.stdout);
//     console.error(result.stderr);
//   }
// }

// /**
//  * If work dir is passed then it will be made an absolute according CWD.
//  * If isn't set then SQUIDLET_ROOT env variable will be used - $SQUIDLET_ROOT/<subDir>.
//  * Otherwise "build/<subDir>" dir or this repository will be used.
//  */
// export function resolveWorkDir(subDir: string, argWorkDir?: string): string {
//   const envRoot: string | undefined = process.env['SQUIDLET_ROOT'];
//
//   if (argWorkDir) {
//     // if it set as an argument - make it absolute
//     return path.resolve(process.cwd(), argWorkDir);
//   }
//   else if (envRoot) {
//     // else use under a $SQUIDLET_ROOT
//     return path.join(envRoot, subDir);
//   }
//
//   return path.join(REPO_ROOT, 'build', subDir);
// }
