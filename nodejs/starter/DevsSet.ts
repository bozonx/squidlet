import * as path from 'path';

import {DevClass} from '../../host/entities/DevManager';
import Props from './Props';
import Io from '../../shared/Io';
import systemConfig from '../../host/config/systemConfig';


export default class DevsSet {
  devSet: {[index: string]: DevClass} = {};
  private readonly io: Io;
  private readonly props: Props;


  constructor(io: Io, props: Props) {
    this.io = io;
    this.props = props;
  }


  async collect() {
    const devsDir = path.join(__dirname, '../', this.props.machine, systemConfig.envSetDirs.system);
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
