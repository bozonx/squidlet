import IoSet from '../system/interfaces/IoSet';
import AppStarter from '../system/AppStarter';
import ConsoleLogger from '../shared/ConsoleLogger';
import HostConfig from '../system/interfaces/HostConfig';
import LogLevel from '../system/interfaces/LogLevel';
import StorageIo from '../system/interfaces/io/StorageIo';
import SysIo from '../system/interfaces/io/SysIo';
import {APP_DESTROY_TIMEOUT_SEC} from '../system/constants';


export default class LightStarter {
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


  async start(
    processExit: (code: number) => void,
    hostConfigOverride?: HostConfig,
    workDir?: string,
    uid?: number,
    gid?: number,
    logLevel?: LogLevel,
    ioServerMode?: boolean
  ) {
    this.consoleLogger = new ConsoleLogger(logLevel);
    this.app = new AppStarter(this.ioSet, hostConfigOverride, this.consoleLogger);

    this.ioSet.init && await this.ioSet.init();
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
            console.error(e);
            processExit(code);
          });
      }
    });

    await this.app.start(ioServerMode);

    this.started = true;
  }

  destroy(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject(`App destroy timeout has been exceeded.`);
      }, APP_DESTROY_TIMEOUT_SEC * 1000);

      if (!this.app) return reject('No app');

      this.app.destroy()
        .then(() => {
          console.info(`... destroying IoSet`);

          this.ioSet.destroy();
        })
        .then(() => {
          delete this.ioSet;
          delete this.app;
          delete this.consoleLogger;

          resolve();
        })
        .catch(reject);
    });
  }

}
