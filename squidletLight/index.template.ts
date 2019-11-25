import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';
import AppSwitcher from '${REPO_ROOT}/system/AppSwitcher';
import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import ConsoleLogger from '${REPO_ROOT}/shared/ConsoleLogger';
// TODO: set paths
import LogLevel from '../system/interfaces/LogLevel';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';
import {SystemEvents} from '../system/constants';
import IoSet from '../system/interfaces/IoSet';
import StorageIo from '../system/interfaces/io/StorageIo';
import SysIo from '../system/interfaces/io/SysIo';


export default async function (
  hostConfigOverride?: PreHostConfig,
  workDir?: string,
  uid?: number,
  gid?: number,
  logLevel?: LogLevel,
  ioServerMode?: boolean,
): Promise<AppSwitcher> {
  const consoleLogger = new ConsoleLogger(logLevel);
  const ioSet: IoSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);

  ioSet.init && await ioSet.init();
  // get Storage IO
  const ioItem = ioSet.getIo<StorageIo>('Storage');
  // set uid, git and workDir to Storage IO
  await ioItem.configure({ uid, gid, workDir });

  // TODO: review
  const restartHandler = () => {
    ioSet.getIo<SysIo>('Sys')
      .reboot()
      .catch(console.error);
  }

  const app: AppSwitcher = new AppSwitcher(ioSet, restartHandler, hostConfigOverride);

  // TODO: review
  app.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
    consoleLogger[level](message);
  });

  await app.start(ioServerMode);

  return app;
}
