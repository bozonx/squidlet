import * as path from 'path';

import {loadMachineConfig, resolvePlatformDir} from '../../control/helpers';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import {DevClass} from '../../host/entities/DevManager';


export default class DevsSet {
  private readonly platform: Platforms;
  private readonly machine: string;


  constructor(platform: Platforms, machine: string) {
    this.platform = platform;
    this.machine = machine;
  }


  collect(): {[index: string]: DevClass} {
    const platformDirName: string = resolvePlatformDir(platform);
    const machineConfig: MachineConfig = loadMachineConfig(platform, machine);
    const platformDevs: string[] = machineConfig.devs;
    const devsSet: {[index: string]: new (...params: any[]) => any} = {};

    for (let devName of platformDevs) {
      const fullDevName = devName;
      const devPath = path.join(platformDirName, DEVS_DIR, fullDevName);

      devsSet[fullDevName] = require(devPath).default;
    }

    return devsSet;
  }

}
