import IoSet from '../../system/interfaces/IoSet';
import * as path from "path";
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import IoSetLocal from '../../system/entities/IoSetLocal';
import IoItem from '../../system/interfaces/IoItem';


export default class IoSetDevelopLocal extends IoSetLocal implements IoSet {
  async prepare() {

  }

  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

}
