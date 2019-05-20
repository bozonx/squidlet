import * as path from 'path';
import _trim = require('lodash/trim');
import _defaultsDeep = require('lodash/defaultsDeep');

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME} from './constants';
import Os, {SpawnCmdResult} from './Os';
import NodejsMachines from '../nodejs/interfaces/NodejsMachines';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import validateHostConfig from '../hostEnvBuilder/hostConfig/validateHostConfig';
import hostDefaultConfig from '../hostEnvBuilder/configs/hostDefaultConfig';


/**
 * Make io name from io path
 */
export function getFileNameOfPath(pathToIo: string): string {
  const parsed = path.parse(pathToIo);

  if (!parsed.name) throw new Error(`Can't parse io name of path "${pathToIo}"`);

  return parsed.name;
}

/**
 * Make list of io names from list of io paths.
 */
export function makeIoNames(devPaths: string[]): string[] {
  return devPaths.map((devPath) => getFileNameOfPath(devPath));
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

export async function getOsMachine(os: Os) {
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
 * Validate and merge config with machine config of specified machine
 */
export async function preparePreHostConfig(preHostConfig: PreHostConfig): Promise<PreHostConfig> {
  const validateError: string | undefined = validateHostConfig(preHostConfig);

  if (validateError) throw new Error(`Invalid host config: ${validateError}`);
  else if (!preHostConfig.platform) throw new Error(`Platform param has to be specified in host config`);

  const machineConfig: MachineConfig = loadMachineConfig(preHostConfig.platform, preHostConfig.machine as string);

  return _defaultsDeep({},
    preHostConfig,
    machineConfig.hostConfig,
    hostDefaultConfig,
  );
}
