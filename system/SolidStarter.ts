import AppStarter from './AppStarter';
import IoSet from './interfaces/IoSet';
import HostConfig from './interfaces/HostConfig';
import LogLevel from './interfaces/LogLevel';
import StorageIo from './interfaces/io/StorageIo';
import SysIo from './interfaces/io/SysIo';
import ConsoleLogger from '../shared/ConsoleLogger';


export default class SolidStarter {
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
    await this.configureIoSet(processExit, workDir, uid, gid);
    await this.app.start(ioServerMode);

    this.started = true;
  }

  async destroy(): Promise<void> {
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

    delete this.ioSet;
    delete this.app;
    delete this.consoleLogger;
  }


  private async configureIoSet(
    processExit: (code: number) => void,
    workDir?: string,
    uid?: number,
    gid?: number,
  ) {
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
            // TODO: может не нужен exit так как при нормальном destroy должно все отработать ?
            processExit(code);
          });
      }
    });
  }

}
