import AppStarter from './AppStarter';
import IoSet from './interfaces/IoSet';
import HostConfig from './interfaces/HostConfig';
import StorageIo from './interfaces/io/StorageIo';
import SysIo from './interfaces/io/SysIo';
import {APP_DESTROY_TIMEOUT_SEC} from './constants';
import Logger from './interfaces/Logger';


/**
 * It manages ioSet object and system starter
 */
export default class Main {
  get hasBeenStarted(): boolean {
    return this.started;
  }

  private ioSet: IoSet;
  private hostConfigOverride?: HostConfig;
  private logger: Logger;
  private app?: AppStarter;
  private started: boolean = false;


  constructor(
    ioSet: IoSet,
    logger: Logger,
    hostConfigOverride?: HostConfig,
    lockAppSwitch?: boolean
  ) {
    this.ioSet = ioSet;
    this.hostConfigOverride = {
      lockAppSwitch,
      ...hostConfigOverride,
    } as HostConfig;
    this.logger = logger;
  }

  async init() {
    this.app = new AppStarter(this.ioSet, this.hostConfigOverride, this.logger);

    delete this.hostConfigOverride;

    this.ioSet.init && await this.ioSet.init();
  }

  destroy(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(`App destroy timeout has been exceeded.`);
      }, APP_DESTROY_TIMEOUT_SEC * 1000);

      this.doDestroy()
        .then(resolve)
        .catch(reject);
    });
  }


  /**
   * Start app or IoServer
   */
  async start() {
    if (!this.app) throw new Error(`No app`);

    await this.app.start();

    this.started = true;
  }

  /**
   * Configure local Storage IO and Sys IO.
   * Don't call it if remote IO set is used.
   * @param processExit
   * @param workDir
   * @param uid
   * @param gid
   */
  async configureIoSet(processExit: (code: number) => void, workDir?: string, uid?: number, gid?: number) {
    // get Storage IO
    const storageIo: StorageIo = this.ioSet.getIo<StorageIo>('Storage');
    const sysIo: SysIo = this.ioSet.getIo<SysIo>('Sys');
    // set uid, git and workDir to Storage IO
    await storageIo.configure({ uid, gid, workDir });
    // make destroy before process.exit
    await sysIo.configure({
      exit: (code: number) => {
        this.destroy()
          .then(() => processExit(code))
          .catch((e: Error) => {
            this.logger.error(String(e));
            processExit(code);
          });
      }
    });
  }

  private async doDestroy() {
    if (!this.app) throw new Error('No app');

    try {
      await this.app.destroy();
    }
    catch (e) {
      this.logger.error(e);
    }

    this.logger.info(`... destroying IoSet`);

    try {
      await this.ioSet.destroy();
    }
    catch (e) {
      this.logger.error(e);
    }
    finally {
      delete this.ioSet;
      delete this.app;
      delete this.logger;
    }
  }

}
