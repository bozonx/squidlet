import * as path from 'path';

import {APP_STARTER_FILE_NAME, SYSTEM_FILE_NAME} from '../../shared/constants';
import IoSet from '../../system/interfaces/IoSet';
import Props from './Props';
import Os from '../../shared/Os';
import {listenScriptEnd} from '../../shared/helpers';
import StorageIo from '../../system/interfaces/io/StorageIo';
import ConsoleLogger from '../../shared/ConsoleLogger';
import Logger from '../../system/interfaces/Logger';
import SysIo from '../../system/interfaces/io/SysIo';


interface SystemKind {
  start(): Promise<void>;
  destroy(): Promise<void>;
}
// AppStarter of System class
type SystemKindClass = new (
  ioSet: IoSet,
  restartRequest: () => void,
  logger?: Logger
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

    // TODO: лучше то наверное использовать сразу файл а не dir
    // TODO: remake to AppStarter ???

    // use System if bareSystem is true or AppStarter if false
    const fileName: string = (this.bareSystem) ? SYSTEM_FILE_NAME : APP_STARTER_FILE_NAME;
    const systemKindFile = path.join(pathToSystemDir, fileName);
    const systemKindClass: SystemKindClass = this.os.require(systemKindFile).default;

    console.info(`===> Initializing app, using "${fileName}"`);

    // init ioSet
    ioSet.init && await ioSet.init();
    await this.configureStorage(ioSet);

    const consoleLogger = new ConsoleLogger(this.props.argLogLevel);

    // TODO: pass workdir etc - see like in squidletLight

    const systemKind: SystemKind = new systemKindClass(
      ioSet,
      {
        // TODO: resolve appType
        appType: 'app',
      },
      // this.handleRestartRequest,
      consoleLogger
    );

    this.listenDestroySignals(systemKind.destroy);

    console.info(`===> Starting app`);

    // TODO: use ioServer Mode
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

    const storageIo = ioSet.getIo<StorageIo>('Storage');
    const sysIo: SysIo = ioSet.getIo<SysIo>('Sys');

    await storageIo.configure({
      uid: this.props.uid,
      gid: this.props.gid,
      workDir: this.props.appWorkDir,
    });
    // make destroy before process.exit
    await sysIo.configure({
      exit: (code: number) => {
        this.destroy()
          .then(() => process.exit(code))
          .catch((e: Error) => {
            console.error(e);
            process.exit(code);
          });
      }
    });
  }

}
