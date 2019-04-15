import * as path from 'path';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';
import {HOME_SHARE_DIR, SQUIDLET_ROOT_DIR_NAME} from './constants';


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

export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
  const platformDir: string = resolvePlatformDir(platform);
  const machineConfigPath = path.join(platformDir, `${platform}-${machine}`);

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
