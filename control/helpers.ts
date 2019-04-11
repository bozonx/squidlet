import * as path from 'path';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../hostEnvBuilder/interfaces/Platforms';


export function resolvePlatformDir(platform: Platforms): string {
  // TODO: !!!!
}

export function loadMachineConfig(platform: Platforms, machine: string): MachineConfig {
  const machineConfigFilePath: string = path.resolve(__dirname, `./lowjs-${envConfig.machine}.ts`);
  // TODO: брать только имя платформы - папку определять самому
  const machineConfigPath = path.join(platformDirName, `${path.basename(platformDirName)}-${machine}`);

  return require(machineConfigPath).default;
}
