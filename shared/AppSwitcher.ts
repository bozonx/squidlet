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
        this.switchToIoServer();

        break;
      case 'switchToApp':
        this.switchToApp();

        break;
      case 'restart':
        this.restart();
        if (this.system) {
          this.system.destroy()
            .then(this.startSystem)
            .catch(console.error);
        }
        else if (this.ioServer) {
          this.ioServer.destroy()
            .then(this.startIoServer)
            .catch(console.error);
        }
        else {
          throw new Error(`Can't restart: IoServer and System aren't set`);
        }

        break;
    }
  }

  private switchToIoServer() {
    if (!this.system) throw new Error(`System isn't set`);

    this.system.destroy()
      .then(this.startIoServer)
      .catch(console.error);

    delete this.system;
  }

  private switchToApp() {
    if (!this.ioServer) throw new Error(`IoServer isn't set`);

    this.ioServer.destroy()
      .then(this.startSystem)
      .catch(console.error);

    delete this.ioServer;
  }

  private restart() {

  }

}
