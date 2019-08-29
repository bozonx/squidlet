import * as path from 'path';

import {APP_SWITCHER_FILE_NAME, HOST_TMP_HOST_DIR, HOST_VAR_DATA_DIR} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import Os from '../../shared/Os';
import {listenScriptEnd} from '../../shared/helpers';
import AppSwitcher, {AppSwitcherClass} from '../../system/AppSwitcher';
import {mergeDeepObjects} from '../../system/lib/objects';
import systemConfig from '../../system/config/systemConfig';
import StorageIo from '../../system/interfaces/io/StorageIo';


export default class SystemStarter {
  private readonly os: Os;
  private readonly props: Props;


  constructor(os: Os, props: Props) {
    this.props = props;
    this.os = os;
  }


  async start(pathToSystemDir: string, ioSet: IoSet) {
    await this.configureStorage(ioSet);

    const appSwitcherFile = path.join(pathToSystemDir, APP_SWITCHER_FILE_NAME);
    const appSwitcherClass: AppSwitcherClass = this.os.require(appSwitcherFile).default;
    const systemCfg = this.makeSystemConfig();

    console.info(`===> Initializing app`);

    const appSwitcher: AppSwitcher = new appSwitcherClass(
      ioSet,
      this.handleRestartRequest,
      systemCfg
    );

    this.listenDestroySignals(appSwitcher.destroy);

    console.info(`===> Starting app`);

    await appSwitcher.start();
  }


  /**
   * It just exits on restart request because this request is make on update
   * and it needs to reload all the imports.
   * You should restart the script in the external code e.g in a systemd service.
   */
  private handleRestartRequest = () => {
    process.exit(0);
  }

  // TODO: remove
  private makeSystemConfig(): typeof systemConfig{
    return mergeDeepObjects({
      rootDirs: {
        envSet: this.props.envSetDir,
        varData: path.join(this.props.workDir, HOST_VAR_DATA_DIR),
        tmp: path.join(this.props.tmpDir, HOST_TMP_HOST_DIR),
      },
    }, systemConfig) as any;
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

  private async configureStorage(ioSet: IoSet) {
    if (typeof this.props.uid === 'undefined' && typeof this.props.gid === 'undefined') return;

    const ioItem = ioSet.getIo<StorageIo>('Storage');

    await ioItem.configure({
      uid: this.props.uid,
      gid: this.props.gid,
    });
  }

}
