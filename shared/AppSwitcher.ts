import IoSet from '../system/interfaces/IoSet';
import {SystemClassType} from './interfaces/SystemClassType';
import System, {ShutdownReason} from '../system/System';
import IoServer from './IoServer';
import systemConfig from '../system/config/systemConfig';


const defaultPathToSystem = `${systemConfig.rootDirs.envSet}/${systemConfig.envSetDirs.system}/System`;


export default class AppSwitcher {
  private readonly ioSet: IoSet;
  private readonly pathToSystem: string;
  private readonly systemConfigExtend?: {[index: string]: any};
  private system?: System;
  private ioServer?: IoServer;


  constructor(ioSet: IoSet, pathToSystem = defaultPathToSystem, systemConfigExtend?: {[index: string]: any}) {
    this.ioSet = ioSet;
    this.pathToSystem = pathToSystem;
    this.systemConfigExtend = systemConfigExtend;
  }


  async start() {
    await this.startSystem();
  }


  private startSystem = async () => {
    const SystemClass: SystemClassType = require(this.pathToSystem).default;

    this.system = new SystemClass(this.ioSet, this.systemConfigExtend);

    this.system.onShutdownRequest(this.handleShutdownRequest);
    await this.system.start();
  }

  private startIoServer = async () => {
    this.ioServer = new IoServer(this.ioSet, console.info, console.error);

    this.ioServer.onShutdownRequest(this.handleShutdownRequest);
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
        this.restart()
          .catch(console.error);
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

  private async restart() {
    if (this.system) {
      await this.system.destroy();
      delete this.system;
      await this.startSystem();
    }
    else if (this.ioServer) {
      await this.ioServer.destroy();
      delete this.ioServer;
      await this.startIoServer();
    }
    else {
      throw new Error(`Can't restart: IoServer and System aren't set`);
    }
  }

}
