import * as path from 'path';
import _trim = require('lodash/trim');

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import Os, {SpawnCmdResult} from './Os';
import NodejsMachines from '../nodejs/interfaces/NodejsMachines';


export const REPO_ROOT = path.resolve(__dirname, '../');
export const SYSTEM_DIR = path.join(REPO_ROOT, 'system');
export const SQUIDLET_PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');


/**
 * Make io name from io path without extension.
 * E.g "/path/to/file.ts" -> "file"
 */
export function getFileNameOfPath(pathToIo: string): string {
  const parsed = path.parse(pathToIo);

  if (!parsed.name) throw new Error(`Can't parse io name of path "${pathToIo}"`);

  return parsed.name;
}

export function resolvePlatformDir(platform: Platforms): string {
  return path.resolve(__dirname, `../${platform}`);
}

export function loadMachineConfigInPlatformDir(os: Os, platformDir: string, machine: string): MachineConfig {
  const machineConfigPath = path.join(platformDir, `machine-${machine}`);

  return os.require(machineConfigPath).default;
}

export async function getOsMachine(os: Os): Promise<NodejsMachines> {
  const spawnResult: SpawnCmdResult = await os.spawnCmd('hostnamectl');

  if (spawnResult.status !== 0) {
    throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
  }

  const {osName, arch} = parseHostNameCtlResult(spawnResult.stdout.join('\n'));

  return resolveMachineByOsAndArch(osName, arch);
}

export function parseHostNameCtlResult(stdout: string): {osName: string, arch: string} {
  const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
  const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

  if (!osMatch) {
    throw new Error(`Can't resolve an operating system of the machine`);
  }
  else if (!architectureMatch) {
    throw new Error(`Can't resolve an architecture of the machine`);
  }

  return {
    osName: _trim(osMatch[1]),
    arch: architectureMatch[1],
  };
}

export function resolveMachineByOsAndArch(osName: string, arch: string): NodejsMachines {
  if (arch.match(/x86/)) {
    // no matter which OS and 32 or 64 bits
    return 'x86';
  }
  else if (arch === 'arm') {
    // TODO: use cpuinfo to resolve Revision or other method
    if (osName.match(/Raspbian/)) {
      return 'rpi';
    }
    else {
      return 'arm';
    }
  }

  throw new Error(`Unsupported architecture "${arch}"`);
}

/**
 * Make list of io names from list of io paths.
 * E.g ['/path/to/file1.ts', '/path/file2'] -> ['file1', 'file2']
 */
export function makeListOfNamesFromPaths(paths: string[]): string[] {
  return paths.map((item) => getFileNameOfPath(item));
}

/**
 * Run command and don't print stdout if it returns code 0
 */
export async function runCmd(os: Os, cmd: string, cwd: string) {
  const result: SpawnCmdResult = await os.spawnCmd(cmd, cwd);

  if (result.status) {
    console.error(`ERROR: npm ends with code ${result.status}`);
    console.error(result.stdout);
    console.error(result.stderr);
  }
}

// TODO: !!! test bellow

/**
 * If work dir is passed then it will be made an absolute according CWD.
 * If isn't set then SQUIDLET_ROOT env variable will be used - $SQUIDLET_ROOT/<subDir>.
 * Otherwise "build/<subDir>" dir or this repository will be used.
 */
export function resolveWorkDir(subDir: string, argWorkDir?: string): string {
  const envRoot: string | undefined = process.env['SQUIDLET_ROOT'];

  if (argWorkDir) {
    // if it set as an argument - make it absolute
    return path.resolve(process.cwd(), argWorkDir);
  }
  else if (envRoot) {
    // else use under a $SQUIDLET_ROOT
    return path.join(envRoot, subDir);
  }

  return path.join(REPO_ROOT, 'build', subDir);
}

// export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
//   const platformDir: string = resolvePlatformDir(platform);
//   const machineConfigPath = path.join(platformDir, `machine-${machine}`);
//
//   return require(machineConfigPath).default;
// }
