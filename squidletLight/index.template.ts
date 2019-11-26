import AppStarter from '${REPO_ROOT}/system/AppStarter';
import IoSetBuiltin from '${REPO_ROOT}/squidletLight/IoSetBuiltin';
import ConsoleLogger from '${REPO_ROOT}/shared/ConsoleLogger';
import LogLevel from '${REPO_ROOT}/system/interfaces/LogLevel';
import IoSet from '${REPO_ROOT}/system/interfaces/IoSet';
import HostConfig from '${REPO_ROOT}/system/interfaces/HostConfig';
import StorageIo from '${REPO_ROOT}/system/interfaces/io/StorageIo';
import SysIo from '${REPO_ROOT}/system/interfaces/io/SysIo';
import envSet from './envSet';
import * as ios from './ios';
import * as devicesMainFiles from './devicesMainFiles';
import * as driversMainFiles from './driversMainFiles';
import * as servicesMainFiles from './servicesMainFiles';
import LightStarter from './LightStarter';


const ioSet: IoSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);


export default function instantiateStarter (): LightStarter {
  return new LightStarter(ioSet);
}

//
// export default class LightStarter {
//   get hasBeenStarted(): boolean {
//     return this.started;
//   }
//
//   private started: boolean = false;
//   private ioSet?: IoSet;
//   private app: AppStarter;
//   private consoleLogger?: ConsoleLogger;
//
//
//   async start(
//     hostConfigOverride?: HostConfig,
//     workDir?: string,
//     uid?: number,
//     gid?: number,
//     logLevel?: LogLevel,
//     ioServerMode?: boolean,
//   ) {
//     this.consoleLogger = new ConsoleLogger(logLevel);
//     this.ioSet = new IoSetBuiltin(envSet, ios, devicesMainFiles, driversMainFiles, servicesMainFiles);
//
//     this.ioSet.init && await this.ioSet.init();
//     // get Storage IO
//     const storageIo: StorageIo = this.ioSet.getIo<StorageIo>('Storage');
//     const sysIo: SysIo = this.ioSet.getIo<SysIo>('Sys');
//     // set uid, git and workDir to Storage IO
//     await storageIo.configure({ uid, gid, workDir });
//     // make destroy before process.exit
//     await sysIo.configure({
//       exit: (code: number) => {
//         this.app.destroy()
//           .then(() => process.exit(code))
//           .catch((e: Error) => {
//             this.consoleLogger.error(e);
//             process.exit(code);
//           });
//       }
//     });
//
//     this.app = new AppStarter(this.ioSet, hostConfigOverride, this.consoleLogger);
//
//     await this.app.start(ioServerMode);
//
//     this.started = true;
//   }
//
//   async destroy() {
//
//     // TODO: add timeout - потом вернуть промис
//
//     await this.app.destroy();
//     await this.ioSet.destroy();
//
//     delete this.ioSet;
//     delete this.app;
//     delete this.consoleLogger;
//   }
//
// }
