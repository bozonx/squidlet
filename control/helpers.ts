import * as path from 'path';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';


export function resolvePlatformDir(platform: Platforms): string {
  return path.resolve(__dirname, `../${platform}`);
}

export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
  const platformDir: string = resolvePlatformDir(platform);
  const machineConfigPath = path.join(platformDir, `${platform}-${machine}`);

  return require(machineConfigPath).default;
}
