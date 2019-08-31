import * as path from 'path';

import {APP_SWITCHER_FILE_NAME, SYSTEM_FILE_NAME} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import Os from '../../shared/Os';
import {listenScriptEnd} from '../../shared/helpers';
import StorageIo from '../../system/interfaces/io/StorageIo';


interface SystemKind {
  start(): Promise<void>;
  destroy(): Promise<void>;
}
// AppSwitcher of System class
type SystemKindClass = new (
  ioSet: IoSet,
  restartRequest: () => void,
) => SystemKind;


export default class SystemStarter {
  private readonly os: Os;
  private readonly props: Props;
  private readonly bareSystem: boolean;


  constructor(os: Os, props: Props, bareSystem: boolean = false) {
    this.props = props;
    this.os = os;
    this.bareSystem = bareSystem;
  }


  async start(pathToSystemDir: string, ioSet: IoSet) {
    // use System if bareSystem is true or AppSwitcher if false
    const fileName: string = (this.bareSystem) ? SYSTEM_FILE_NAME : APP_SWITCHER_FILE_NAME;
    const appSwitcherFile = path.join(pathToSystemDir, fileName);
    const systemKindClass: SystemKindClass = this.os.require(appSwitcherFile).default;

    console.info(`===> Initializing app, using "${fileName}"`);


    // init ioSet
    ioSet.init && await ioSet.init();
    // TODO: не запускать это в режиме удаленного IOset
    await this.configureStorage(ioSet);

    const systemKind: SystemKind = new systemKindClass(
      ioSet,
      this.handleRestartRequest
    );

    this.listenDestroySignals(systemKind.destroy);

    console.info(`===> Starting app`);

    await systemKind.start();
  }


  /**
   * It just exits on restart request because this request is make on update
   * and it needs to reload all the imports.
   * You should restart the script in the external code e.g in a systemd service.
   */
  private handleRestartRequest = () => {
    process.exit(0);
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
