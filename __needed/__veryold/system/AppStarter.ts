import IoSet from './interfaces/IoSet';
import System from './System';
import IoServer from './IoServer';
import {AppType} from './interfaces/AppType';
import Logger from './interfaces/Logger';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from './constants';
import LogLevel from './interfaces/LogLevel';
import HostConfig from './interfaces/HostConfig';
import StorageIo from './interfaces/io/StorageIo';
import {pathJoin} from './lib/paths';
import systemConfig from './systemConfig';
import ConsoleLogger from './ConsoleLogger';


/**
 * It switches between System and IoServer
 */
export default class AppStarter {
  private ioSet: IoSet;
  private readonly hostConfigOverride?: HostConfig;
  private logger: Logger;
  private system?: System;
  //private ioServer?: IoServer;


  constructor(ioSet: IoSet, hostConfigOverride?: HostConfig, logger: Logger = new ConsoleLogger()) {
    this.ioSet = ioSet;
    this.hostConfigOverride = hostConfigOverride;
    this.logger = logger;
  }

  destroy = async (): Promise<void> => {
    //const app = (this.system) ? this.system : this.ioServer;
    const app = this.system;

    if (!app) throw new Error('No app');

    try {
      await app.destroy();
    }
    catch (e) {
      throw e;
    }
    finally {
      delete this.ioSet;
      delete this.system;
      //delete this.ioServer;
      delete this.logger;
    }
  }


  async start() {
    //let startIoServer: boolean = startIoServerFirst;
    let fileContent: AppType | undefined;
    const storageIo: StorageIo = await this.ioSet.getIo<StorageIo>('Storage');
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.tmp,
      START_APP_TYPE_FILE_NAME,
    );
    const fileExists: boolean = await storageIo.exists(startAppTypeFileName);

    if (fileExists) {
      fileContent = await storageIo.readFile(startAppTypeFileName) as AppType;

      //startIoServer = fileContent === 'ioServer';
    }

    // if (startIoServer) {
    //   await this.startIoServer();
    // }
    // else {
    //   await this.startSystem(fileContent);
    // }

    await this.startSystem(fileContent);
  }


  private startSystem = async (specifiedAppType?: AppType) => {
    const hostConfigOverride: HostConfig = { ...this.hostConfigOverride } as any;

    if (specifiedAppType) {
      hostConfigOverride.appType = specifiedAppType;
    }

    this.system = new System(this.ioSet, hostConfigOverride);

    this.system.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
      this.logger[level](message);
    });

    await this.system.start();
  }

  // private startIoServer = async () => {
  //   this.ioServer = new IoServer( this.ioSet, this.logger );
  //
  //   await this.ioServer.start();
  // }

}

// private handleShutdownRequest = (reason: AppType) => {
//   switch (reason) {
//     case 'switchToIoServer':
//       this.switchToIoServer()
//         .catch(consoleError);
//       break;
//     case 'switchToApp':
//       this.switchToApp()
//         .catch(consoleError);
//       break;
//     case 'restart':
//       this.restartRequest();
//       break;
//   }
// }

// private async switchToIoServer() {
//   if (!this.system) throw new Error(`System isn't set`);
//
//   await this.system.destroy();
//   delete this.system;
//   await this.startIoServer();
// }
//
// private async switchToApp() {
//   if (!this.ioServer) throw new Error(`IoServer isn't set`);
//
//   await this.ioServer.destroy();
//   delete this.ioServer;
//   await this.startSystem();
// }
