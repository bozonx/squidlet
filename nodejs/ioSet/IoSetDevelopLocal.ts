import IoSet from '../../system/interfaces/IoSet';
import * as path from "path";
import {HOST_ENVSET_DIR} from '../../shared/constants';
import EnvBuilder from '../../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../../hostEnvBuilder/interfaces/HostEnvSet';
import IoSetLocal from '../../system/entities/IoSetLocal';
import IoItem from '../../system/interfaces/IoItem';


export default class IoSetDevelopLocal extends IoSetLocal implements IoSet {

  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }


  // private async configureEnvSet() {
  //
  //   // TODO review
  //
  //   const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
  //   const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);
  //
  //   console.info(`===> generate hosts env files and configs`);
  //
  //   await envBuilder.collect();
  //
  //   console.info(`===> generate master config object`);
  //
  //   const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();
  //
  //   console.info(`===> initializing system`);
  //
  //   //EnvSetMemory.$registerConfigSet(hostEnvSet);
  // }

}
