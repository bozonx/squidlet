import * as path from 'path';

import {DevClass} from '../../system/entities/DevManager';
import Io from '../../shared/Io';
import systemConfig from '../../system/config/systemConfig';
import MachineConfig from '../../hostEnvBuilder/interfaces/MachineConfig';
import {loadMachineConfig, parseDevName} from '../../shared/helpers';


export default class DevsSet {
  private readonly io: Io;
  private readonly machine: string;


  constructor(io: Io, machine: string) {
    this.io = io;
    this.machine = machine;
  }


  async makeProdDevSet(): {[index: string]: DevClass} {
    const devsSet: {[index: string]: new (...params: any[]) => any} = {};
    const machineConfig: MachineConfig = loadMachineConfig(this.platform, this.machine);

    for (let devPath of machineConfig.devs) {
      const devName: string = parseDevName(devPath);

    }

    // TODO: remake

    const devsDir = path.join(__dirname, '../', this.machine, systemConfig.envSetDirs.system);
    const devsFiles: string[] = await this.io.readdir(devsDir);


    for (let devFileName of devsFiles) {
      const devName = path.parse(devFileName).name;
      const devPath = path.join(devsDir, devFileName);

      devsSet[devName] = require(devPath).default;
    }

    return devsSet;
  }

  async makeDevelopDevSet(): {[index: string]: DevClass} {
    // TODO: собрать dev devset
  }

}
