import * as path from 'path';

import {loadMachineConfig, resolvePlatformDir} from '../../control/helpers';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {DevClass} from '../../host/entities/DevManager';


const DEVS_DIR = 'devs';


export default class DevsSet {
  devSet: {[index: string]: DevClass} = {};


  constructor() {
  }


  collect() {

    // TODO: лучше просто считать из папки все devs

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
