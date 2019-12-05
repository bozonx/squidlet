import AppStarter from './AppStarter';
import IoSet from './interfaces/IoSet';
import HostConfig from './interfaces/HostConfig';
import LogLevel from './interfaces/LogLevel';
import StorageIo from './interfaces/io/StorageIo';
import SysIo from './interfaces/io/SysIo';
import ConsoleLogger from './ConsoleLogger';
import {APP_DESTROY_TIMEOUT_SEC} from './constants';


/**
 * It manages ioSet object and system starter
 */
export default class Main {
  get hasBeenStarted(): boolean {
    return this.started;
  }

  private ioSet: IoSet;
  private app?: AppStarter;
  private consoleLogger?: ConsoleLogger;
  private started: boolean = false;


  constructor(ioSet: IoSet) {
    this.ioSet = ioSet;
  }

  async init(hostConfigOverride?: HostConfig, logLevel?: LogLevel) {
    this.consoleLogger = new ConsoleLogger(logLevel);
    this.app = new AppStarter(this.ioSet, hostConfigOverride, this.consoleLogger);

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
   * @param ioServerMode
   * @param lockIoServer - disallow switch to App from IoServer
   */
  async start(ioServerMode?: boolean, lockIoServer?: boolean) {
    if (!this.app) throw new Error(`No app`);

    await this.app.start(ioServerMode, lockIoServer);

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
            if (!this.consoleLogger) throw new Error('No consoleLogger');

            this.consoleLogger.error(e);
            processExit(code);
          });
      }
    });
  }

  private async doDestroy() {
    if (!this.app) throw new Error('No app');
    if (!this.consoleLogger) throw new Error('No consoleLogger');

    try {
      await this.app.destroy();
    }
    catch (e) {
      this.consoleLogger.error(e);
    }

    this.consoleLogger.info(`... destroying IoSet`);

    try {
      await this.ioSet.destroy();
    }
    catch (e) {
      this.consoleLogger.error(e);
    }
    finally {
      delete this.ioSet;
      delete this.app;
      delete this.consoleLogger;
    }
  }

}
