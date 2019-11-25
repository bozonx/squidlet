import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';
import AppSwitcher from '${REPO_ROOT}/system/AppSwitcher';
import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import ConsoleLogger from '${REPO_ROOT}/shared/ConsoleLogger';
import LogLevel from '${REPO_ROOT}/system/interfaces/LogLevel';
import IoSet from '${REPO_ROOT}/system/interfaces/IoSet';
import StorageIo from '../system/interfaces/io/StorageIo';
import HostConfig from '${REPO_ROOT}/system/interfaces/HostConfig';


export default async function (
  hostConfigOverride?: HostConfig,
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

  const app: AppSwitcher = new AppSwitcher(ioSet, hostConfigOverride, consoleLogger);

  await app.start(ioServerMode);

  return app;
}
