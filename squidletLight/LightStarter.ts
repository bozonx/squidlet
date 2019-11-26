import IoSet from '../system/interfaces/IoSet';
import AppStarter from '../system/AppStarter';
import ConsoleLogger from '../shared/ConsoleLogger';
import HostConfig from '../system/interfaces/HostConfig';
import LogLevel from '../system/interfaces/LogLevel';
import StorageIo from '../system/interfaces/io/StorageIo';
import SysIo from '../system/interfaces/io/SysIo';


export default class LightStarter {
  get hasBeenStarted(): boolean {
    return this.started;
  }

  private ioSet: IoSet;
  private app?: AppStarter;
  private consoleLogger?: ConsoleLogger;
  private started: boolean = false;


  constructor(ioSet: IoSet, ) {
    this.ioSet = ioSet;
  }


  async start(
    hostConfigOverride?: HostConfig,
    workDir?: string,
    uid?: number,
    gid?: number,
    ioServerMode?: boolean,
    logLevel?: LogLevel
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
        if (!this.app) return console.error('No app');

        this.app.destroy()
          .then(() => process.exit(code))
          .catch((e: Error) => {
            console.error(e);
            process.exit(code);
          });
      }
    });

    await this.app.start(ioServerMode);

    this.started = true;
  }

  async destroy() {

    // TODO: add timeout - потом вернуть промис

    this.app && await this.app.destroy();
    await this.ioSet.destroy();

    delete this.ioSet;
    delete this.app;
    delete this.consoleLogger;
  }

}
