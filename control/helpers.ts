import * as path from 'path';

import MachineConfig from '../hostEnvBuilder/interfaces/MachineConfig';


export function loadMachineConfig(platformDirName: string, machine: string): MachineConfig {
  const machineConfigPath = path.join(platformDirName, `${path.basename(platformDirName)}-${machine}`);

  return require(machineConfigPath).default;
}
