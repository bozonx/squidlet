import AppStarter from '${REPO_ROOT}/system/AppStarter';
import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import ConsoleLogger from '${REPO_ROOT}/shared/ConsoleLogger';
import LogLevel from '${REPO_ROOT}/system/interfaces/LogLevel';
import IoSet from '${REPO_ROOT}/system/interfaces/IoSet';
import HostConfig from '${REPO_ROOT}/system/interfaces/HostConfig';
import StorageIo from '${REPO_ROOT}/system/interfaces/io/StorageIo';
import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';


export default class LightStarter {
  constructor(
    hostConfigOverride?: HostConfig,
    workDir?: string,
    uid?: number,
    gid?: number,
    logLevel?: LogLevel,
    ioServerMode?: boolean,
  ) {

  }


  hasBeenStarted(): boolean {

  }


  async start() {
    let app: AppStarter;
    const consoleLogger = new ConsoleLogger(logLevel);
    const ioSet: IoSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);

    // TODO: нужно же ещё задестроить ioSet

    ioSet.init && await ioSet.init();
    // get Storage IO
    const storageIo = ioSet.getIo<StorageIo>('Storage');
    const sysIo = ioSet.getIo<StorageIo>('Sys');
    // set uid, git and workDir to Storage IO
    await storageIo.configure({ uid, gid, workDir });
    // make destroy before process.exit
    await sysIo.configure({
      exit: (code: number) => {
        app.destroy()
          .then(() => process.exit(code))
          .catch((e: Error) => {
            consoleLogger.error(e);
            process.exit(code);
          });
      }
    });

    app = new AppStarter(ioSet, hostConfigOverride, consoleLogger);

    await app.start(ioServerMode);

    return app;
  }

  async destroy() {

  }

}
