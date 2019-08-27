import IoSet from './interfaces/IoSet';
import {SystemClassType} from './interfaces/SystemClassType';
import System from './System';
import IoServer from './IoServer';
import systemConfig from './config/systemConfig';
import {ShutdownReason} from './interfaces/ShutdownReason';


const defaultPathToSystem = `${systemConfig.rootDirs.envSet}/${systemConfig.envSetDirs.system}/System`;


export default class AppSwitcher {
  private readonly ioSet: IoSet;
  private readonly restartRequest: () => void;
  private readonly pathToSystem: string;
  private readonly systemConfigExtend?: {[index: string]: any};
  private system?: System;
  private ioServer?: IoServer;


  constructor(
    ioSet: IoSet,
    restartRequest: () => void,
    pathToSystem = defaultPathToSystem,
    systemConfigExtend?: {[index: string]: any}
  ) {
    this.ioSet = ioSet;
    this.restartRequest = restartRequest;
    this.pathToSystem = pathToSystem;
    this.systemConfigExtend = systemConfigExtend;
  }


  async start() {
    await this.startSystem();
  }


  private startSystem = async () => {
    const SystemClass: SystemClassType = require(this.pathToSystem).default;

    this.system = new SystemClass(this.ioSet, this.handleShutdownRequest, this.systemConfigExtend);

    await this.system.start();
  }

  private startIoServer = async () => {
    this.ioServer = new IoServer(this.ioSet, this.handleShutdownRequest, console.info, console.error);

    await this.ioServer.start();
  }

  private handleShutdownRequest(reason: ShutdownReason) {
    switch (reason) {
      case 'switchToIoServer':
        this.switchToIoServer()
          .catch(console.error);
        break;
      case 'switchToApp':
        this.switchToApp()
          .catch(console.error);
        break;
      case 'restart':
        this.restartRequest();
        break;
    }
  }

  private async switchToIoServer() {
    if (!this.system) throw new Error(`System isn't set`);

    await this.system.destroy();
    delete this.system;
    await this.startIoServer();
  }

  private async switchToApp() {
    if (!this.ioServer) throw new Error(`IoServer isn't set`);

    await this.ioServer.destroy();
    delete this.ioServer;
    await this.startSystem();
  }

}
