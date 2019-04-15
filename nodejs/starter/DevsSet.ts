import * as path from 'path';

import {DevClass} from '../../system/entities/DevManager';
import Io from '../../shared/Io';
import systemConfig from '../../system/config/systemConfig';


export default class DevsSet {
  devSet: {[index: string]: DevClass} = {};
  private readonly io: Io;
  private readonly machine: string;


  constructor(io: Io, machine: string) {
    this.io = io;
    this.machine = machine;
  }


  async collect() {
    const devsDir = path.join(__dirname, '../', this.machine, systemConfig.envSetDirs.system);
    const devsFiles: string[] = await this.io.readdir(devsDir);
    const devsSet: {[index: string]: new (...params: any[]) => any} = {};

    for (let devFileName of devsFiles) {
      const devName = path.parse(devFileName).name;
      const devPath = path.join(devsDir, devFileName);

      devsSet[devName] = require(devPath).default;
    }

    return devsSet;
  }

}
