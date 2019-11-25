import IoSet from './interfaces/IoSet';
import System from './System';
import IoServer from './ioServer/IoServer';
import {AppType} from './interfaces/AppType';
import IoItem from './interfaces/IoItem';
import Logger from './interfaces/Logger';
import ConsoleLogger from '../shared/ConsoleLogger';
import {START_APP_TYPE_FILE_NAME, SystemEvents} from './constants';
import LogLevel from './interfaces/LogLevel';
import HostConfig from './interfaces/HostConfig';
import StorageIo from './interfaces/io/StorageIo';
import {pathJoin} from './lib/paths';
import systemConfig from './systemConfig';


export default class AppStarter {
  private readonly ioSet: IoSet;
  private readonly hostConfigOverride?: HostConfig;
  private readonly logger: Logger;
  private system?: System;
  private ioServer?: IoServer;


  constructor(ioSet: IoSet, hostConfigOverride?: HostConfig, logger: Logger = new ConsoleLogger()) {
    this.ioSet = ioSet;
    this.hostConfigOverride = hostConfigOverride;
    this.logger = logger;
  }

  destroy = async () => {

    // TODO: add timeout - потом вернуть промис

    // destroy of System or IoServer
    if (this.system) {
      await this.system.destroy();
    }
    else if (this.ioServer) {
      await this.ioServer.destroy();
    }

    // destroy of ios
    const ioNames: string[] = this.ioSet.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.ioSet.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    // destroy of ioSet
    await this.ioSet.destroy();
  }


  async start(startIoServerFirst: boolean = false) {
    let startIoServer: boolean = startIoServerFirst;
    const storageIo: StorageIo = await this.ioSet.getIo<StorageIo>('Storage');
    const startAppTypeFileName: string = pathJoin(
      systemConfig.rootDirs.tmp,
      START_APP_TYPE_FILE_NAME,
    );
    const fileExists: boolean = await storageIo.exists(startAppTypeFileName);

    if (fileExists) {
      const fileContent: AppType = await storageIo.readFile(startAppTypeFileName) as AppType;

      startIoServer = fileContent === 'ioServer';
    }

    if (startIoServer) {
      await this.startIoServer();
    }
    else {
      await this.startSystem();
    }
  }


  private startSystem = async () => {
    this.system = new System(this.ioSet, this.hostConfigOverride);

    this.system.addListener(SystemEvents.logger, (level: LogLevel, message: string) => {
      this.logger[level](message);
    });

    await this.system.start();
  }

  private startIoServer = async () => {
    this.ioServer = new IoServer(
      this.ioSet,
      this.logger.debug,
      this.logger.info,
      this.logger.error
    );

    await this.ioServer.start();
  }

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
