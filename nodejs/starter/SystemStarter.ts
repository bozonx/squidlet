import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import System from '../../system';


type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;


export default class SystemStarter {
  private readonly props: Props;


  constructor(props: Props) {
    this.props = props;
  }


  async start(pathToSystem: string, ioSet?: IoSet) {
    const SystemClass = this.requireSystemClass(pathToSystem);
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
    const gracefullyDestroy = async () => {
      setTimeout(() => {
        console.error(`ERROR: App hasn't been gracefully destroyed during "${this.props.destroyTimeoutSec}" seconds`);
        process.exit(3);
      }, this.props.destroyTimeoutSec * 1000);

      try {
        await destroy();
        process.exit(0);
      }
      catch (err) {
        console.error(err);
        process.exit(2);
      }
    };

    process.on('SIGTERM', gracefullyDestroy);
    process.on('SIGINT', gracefullyDestroy);
  }

  /**
   * Wrapper for test purpose
   */
  private requireSystemClass(pathToSystem: string): SystemClassType {
    return require(pathToSystem).default;
  }

}
