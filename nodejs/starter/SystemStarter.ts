import * as path from 'path';

import {APP_SWITCHER_FILE_NAME, HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import Os from '../../shared/Os';
import {listenScriptEnd} from '../../shared/helpers';
import AppSwitcher, {AppSwitcherClass} from '../../system/AppSwitcher';


export default class SystemStarter {
  private readonly os: Os;
  private readonly props: Props;


  constructor(os: Os, props: Props) {
    this.props = props;
    this.os = os;
  }


  async start(pathToSystemDir: string, ioSet: IoSet) {
    const appSwitcherFile = path.join(pathToSystemDir, APP_SWITCHER_FILE_NAME);
    //const systemFile = path.join(pathToSystemDir, SYSTEM_FILE_NAME);
    const appSwitcherClass: AppSwitcherClass = this.os.require(appSwitcherFile).default;
    const systemConfigExtend = this.makeSystemConfigExtend();

    console.info(`===> Initializing app`);

    const appSwitcher: AppSwitcher = new appSwitcherClass(
      ioSet,
      this.handleRestartRequest,
      //systemFile,
      systemConfigExtend
    );

    this.listenDestroySignals(appSwitcher.destroy);

    console.info(`===> Starting app`);

    return appSwitcher.start();
  }


  private handleRestartRequest = () => {

  }

  private makeSystemConfigExtend(): {[index: string]: any} {
    return {
      rootDirs: {
        envSet: this.props.envSetDir,
        varData: path.join(this.props.workDir, HOST_VAR_DATA_DIR),
        tmp: path.join(this.props.tmpDir, HOST_TMP_HOST_DIR),
      },

      // TODO: передать user group
    };
  }

  private listenDestroySignals(destroy: () => Promise<void>) {
    listenScriptEnd(() => this.gracefullyDestroyCb(destroy));
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
