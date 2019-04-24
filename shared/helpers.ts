import * as path from 'path';
import * as ts from 'typescript';
import _trim = require('lodash/trim');

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME} from './constants';
import {DevClass} from '../system/entities/DevManager';
import Os, {SpawnCmdResult} from './Os';
import NodejsMachines from '../nodejs/interfaces/NodejsMachines';


/**
 * Make dev name from dev path
 */
export function parseDevName(pathToDev: string): string {
  const parsed = path.parse(pathToDev);

  if (!parsed.name) throw new Error(`Can't parse dev name of path "${pathToDev}"`);

  return parsed.name;
}

/**
 * Make list of dev names from list of dev paths.
 */
export function makeDevNames(devPaths: string[]): string[] {
  return devPaths.map((devPath) => parseDevName(devPath));
}

export function resolvePlatformDir(platform: Platforms): string {
  return path.resolve(__dirname, `../${platform}`);
}

export function loadMachineConfigInPlatformDir(platformDir: string, machine: string): MachineConfig {
  const machineConfigPath = path.join(platformDir, `machine-${machine}`);

  return require(machineConfigPath).default;
}

// TODO: remove, may be use loadMachineConfigInPlatformDir instead of it
export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
  const platformDir: string = resolvePlatformDir(platform);
  const machineConfigPath = path.join(platformDir, `machine-${machine}`);

  return require(machineConfigPath).default;
}

/**
 * If SQUIDLET_ROOT environment variable is set, it will be used.
 * Else use default dir.
 * If $XDG_DATA_HOME is either not set or empty, a default equal to $HOME/.local/share should be used.
 */
export function resolveSquidletRoot(): string {
  const envVar: string | undefined = process.env['SQUIDLET_ROOT'];
  const xdgDataHome: string | undefined = process.env['XDG_DATA_HOME'];

  if (envVar) return envVar;

  if (xdgDataHome) {
    return path.join(xdgDataHome, SQUIDLET_ROOT_DIR_NAME);
  }

  return path.join(process.env['HOME'] as string, HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME);
}

/**
 * Read a whole directory 'devs' of platform and load all the it's files
 */
export async function makeDevelopIoSet(
  os: Os,
  platformDir: string,
  machine: string
): Promise<{[index: string]: DevClass}> {
  const devsSet: {[index: string]: new (...params: any[]) => any} = {};
  const machineConfig: MachineConfig = loadMachineConfigInPlatformDir(platformDir, machine);
  const evalModulePath: string = path.join(platformDir, machine, 'evalModule');
  const machineEvalModule: any = require(evalModulePath);

  for (let devPath of machineConfig.devs) {
    const devName: string = parseDevName(devPath);
    const devAbsPath = path.resolve(platformDir, devPath);
    const moduleContent: string = await io.getFileContent(devAbsPath);
    const compinedModuleContent: string = ts.transpile(moduleContent);

    devsSet[devName] = machineEvalModule(compinedModuleContent);
  }

  return devsSet;
}

export async function getOsMachine(os: Os) {
  const spawnResult: SpawnCmdResult = await io.spawnCmd('hostnamectl');

  if (spawnResult.status !== 0) {
    throw new Error(`Can't execute a "hostnamectl" command: ${spawnResult.stderr.join('\n')}`);
  }

  const {os, arch} = parseHostNameCtlResult(spawnResult.stdout.join('\n'));

  return resolveMachineByOsAndArch(os, arch);
}


export function parseHostNameCtlResult(stdout: string): {os: string, arch: string} {
  const osMatch = stdout.match(/Operating System:\s*(.+)$/m);
  const architectureMatch = stdout.match(/Architecture:\s*([\w\d\-]+)/);

  if (!osMatch) {
    throw new Error(`Can't resolve an operating system of the machine`);
  }
  else if (!architectureMatch) {
    throw new Error(`Can't resolve an architecture of the machine`);
  }

  return {
    os: _trim(osMatch[1]),
    arch: architectureMatch[1],
  };
}

export function resolveMachineByOsAndArch(os: string, arch: string): NodejsMachines {
  if (arch.match(/x86/)) {
    // no matter which OS and 32 or 64 bits
    return 'x86';
  }
  else if (arch === 'arm') {
    // TODO: use cpuinfo to resolve Revision or other method
    if (os.match(/Raspbian/)) {
      return 'rpi';
    }
    else {
      return 'arm';
    }
  }

  throw new Error(`Unsupported architecture "${arch}"`);
}

export resolveIoSetClass() {

}
