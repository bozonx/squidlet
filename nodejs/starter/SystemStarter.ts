import * as path from 'path';

import {HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import System from '../../system';


export type SystemClassType = new (ioSet?: IoSet, systemConfigExtend?: {[index: string]: any}) => System;


export default class SystemStarter {
  private readonly props: Props;


  constructor(props: Props) {
    this.props = props;
  }


  async startSystem(props: Props, SystemClass: SystemClassType, ioSet?: IoSet) {
    const systemConfigExtend = this.makeSystemConfigExtend(props);

    console.info(`===> Initializing system`);

    const system = new SystemClass(ioSet, systemConfigExtend);

    this.listenDestroySignals(props.destroyTimeoutSec, system.destroy);

    console.info(`===> Starting system`);

    return system.start();
  }


  private makeSystemConfigExtend(props: Props): {[index: string]: any} {
    return {
      rootDirs: {
        envSet: props.envSetDir,
        varData: path.join(props.workDir, HOST_VAR_DATA_DIR),
        tmp: path.join(props.tmpDir, HOST_TMP_HOST_DIR),
      },
    };
  }

  private listenDestroySignals(destroyTimeoutSec: number, destroy: () => Promise<void>) {
    const gracefullyDestroy = async () => {
      setTimeout(() => {
        console.error(`ERROR: App hasn't been gracefully destroyed during "${destroyTimeoutSec}" seconds`);
        process.exit(3);
      }, destroyTimeoutSec * 1000);

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

}
