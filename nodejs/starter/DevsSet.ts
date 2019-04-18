import * as path from 'path';

import {DevClass} from '../../system/entities/DevManager';
import Io from '../../shared/Io';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfig, parseDevName, resolvePlatformDir} from '../../shared/helpers';
import Platforms from '../../hostEnvBuilder/interfaces/Platforms';
import {BUILD_DEVS_DIR} from '../../shared/constants';


export default class DevsSet {
  private readonly io: Io;
  private readonly platform: Platforms;
  private readonly machine: string;
  private readonly workDir: string;


  constructor(io: Io, platform: Platforms, machine: string, workDir: string) {
    this.io = io;
    this.platform = platform;
    this.machine = machine;
    this.workDir = workDir;
  }


  async makeProdDevSet(): Promise<{[index: string]: DevClass}> {
    const devsSet: {[index: string]: new (...params: any[]) => any} = {};
    const envSetDevsDir = path.join(this.workDir, BUILD_DEVS_DIR);
    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    for (let devPath of machineConfig.devs) {
      const devName: string = parseDevName(devPath);
      const devFileName: string = `${devName}.js`;
      const devAbsPath: string = path.join(envSetDevsDir, devFileName);

      devsSet[devName] = require(devAbsPath).default;
    }

    return devsSet;
  }

  async makeDevelopDevSet(): Promise<{[index: string]: DevClass}> {

    // TODO: загрузить все что есть в папке devs текущей машины

    const devsSet: {[index: string]: new (...params: any[]) => any} = {};
    const platformDir = resolvePlatformDir(this.platform);
    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    for (let devPath of machineConfig.devs) {
      const devName: string = parseDevName(devPath);
      const devAbsPath = path.resolve(platformDir, devPath);

      devsSet[devName] = require(devAbsPath).default;
    }

    return devsSet;
  }

}


// const devsDir = path.join(__dirname, '../', this.machine, systemConfig.envSetDirs.system);
// const devsFiles: string[] = await this.io.readdir(devsDir);
//
//
// for (let devFileName of devsFiles) {
//   const devName = path.parse(devFileName).name;
//   const devPath = path.join(devsDir, devFileName);
//
//   devsSet[devName] = require(devPath).default;
// }
