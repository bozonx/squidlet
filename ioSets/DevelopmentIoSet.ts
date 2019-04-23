import IoSet from '../system/interfaces/IoSet';
import * as path from "path";
import {HOST_ENVSET_DIR} from '../shared/constants';
import EnvBuilder from '../hostEnvBuilder/EnvBuilder';
import HostEnvSet from '../hostEnvBuilder/interfaces/HostEnvSet';


export default class DevelopmentIoSet implements IoSet {
  constructor() {

  }


  private async configureEnvSet() {

    // TODO review

    const tmpDir = path.join(this.props.tmpDir, HOST_ENVSET_DIR);
    const envBuilder: EnvBuilder = new EnvBuilder(this.props.hostConfig, this.props.envSetDir, tmpDir);

    console.info(`===> generate hosts env files and configs`);

    await envBuilder.collect();

    console.info(`===> generate master config object`);

    const hostEnvSet: HostEnvSet = envBuilder.generateHostEnvSet();

    console.info(`===> initializing system`);

    //EnvSetMemory.$registerConfigSet(hostEnvSet);
  }

}
