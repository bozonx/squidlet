import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import Main from '${REPO_ROOT}/system/Main';
import IoSet from '${REPO_ROOT}/system/interfaces/IoSet';
import HostConfig from '${REPO_ROOT}/system/interfaces/HostConfig';
import LogLevel from '${REPO_ROOT}/system/interfaces/LogLevel';
import ConsoleLogger from '${REPO_ROOT}/system/ConsoleLogger';
import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';


const ioSet: IoSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);


export default function instantiateMain (
  hostConfigOverride?: HostConfig,
  logLevel?: LogLevel
): Main {
  const consoleLogger = new ConsoleLogger(logLevel || ${LOG_LEVEL});

  return new Main(
    ioSet,
    consoleLogger,
    hostConfigOverride
  );
}
