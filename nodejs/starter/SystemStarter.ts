import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import System from '../../system';
import Os from '../../shared/Os';


type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;


export default class SystemStarter {
  private readonly os: Os;
  private readonly props: Props;


  constructor(os: Os, props: Props) {
    this.props = props;
    this.os = os;
  }


  async start(pathToSystem: string, ioSet?: IoSet) {
    const SystemClass: SystemClassType = this.os.require(pathToSystem).default;
    const systemConfigExtend = this.makeSystemConfigExtend();

    console.info(`===> Initializing system`);

    const system = new SystemClass(ioSet, systemConfigExtend);

    this.listenDestroySignals(system.destroy);

    console.info(`===> Starting system`);

    return system.start();
  }


  private makeSystemConfigExtend(): {[index: string]: any} {
    return {
      rootDirs: {
        envSet: this.props.envSetDir,
        varData: path.join(this.props.workDir, HOST_VAR_DATA_DIR),
        tmp: path.join(this.props.tmpDir, HOST_TMP_HOST_DIR),
      },
    };
  }

  private listenDestroySignals(destroy: () => Promise<void>) {
    process.on('SIGTERM', () => this.gracefullyDestroyCb(destroy));
    process.on('SIGINT', () => this.gracefullyDestroyCb(destroy));
  }

  private gracefullyDestroyCb = async (destroy: () => Promise<void>) => {
    setTimeout(() => {
      console.error(`ERROR: App hasn't been gracefully destroyed during "${this.props.destroyTimeoutSec}" seconds`);
      this.os.processExit(3);
    }, this.props.destroyTimeoutSec * 1000);

    try {
      await destroy();
      this.os.processExit(0);
    }
    catch (err) {
      console.error(err);
      this.os.processExit(2);
    }
  }

}
