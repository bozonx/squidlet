import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';
import AppSwitcher from '${REPO_ROOT}/system/AppSwitcher';
import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import ConsoleLogger from '${REPO_ROOT}/shared/ConsoleLogger';
import LogLevel from '../system/interfaces/LogLevel';
import PreHostConfig from '../hostEnvBuilder/interfaces/PreHostConfig';


export default async function (
  hostConfigOverride?: PreHostConfig,
  workDir?: string,
  uid?: number,
  gid?: number,
  logLevel?: LogLevel,
  ioServerMode?: boolean,
): Promise<AppSwitcher> {
  // TODO: почему бы не сделать его в AppSwitcher ???
  const consoleLogger = new ConsoleLogger(undefined)
  const ioSet: any = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);

  // TODO: configure io set - pass user, group
  await ioSet.init();

  const restartHandler = () => ioSet.getIo('Sys').restart().catch(console.error);

  // TODO: ioServerMode - значит стазу переключиться в ioServer

  const app: AppSwitcher = new AppSwitcher(ioSet, restartHandler, consoleLogger);

  await app.start();

  return app;
}
