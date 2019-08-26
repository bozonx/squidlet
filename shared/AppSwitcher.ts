import IoSet from '../system/interfaces/IoSet';
import {SystemClassType} from './interfaces/SystemClassType';
import System, {ShutdownReason} from '../system/System';
import IoServer from './IoServer';
import systemConfig from '../system/config/systemConfig';


const defaultPathToSystem = `${systemConfig.rootDirs.envSet}/${systemConfig.envSetDirs.system}/System`;


export default class AppSwitcher {
  private pathToSystem: string;
  private readonly ioSet: IoSet;
  private system?: System;
  private ioServer?: IoServer;


  constructor(ioSet: IoSet, pathToSystem = defaultPathToSystem) {
    this.ioSet = ioSet;
    this.pathToSystem = pathToSystem;
  }


  async start() {
    await this.startSystem();
  }


  private async startSystem() {
    const SystemClass: SystemClassType = require(this.pathToSystem).default;

    this.system = new SystemClass(this.ioSet);

    this.system.onShutdownRequest(this.handleShutdownRequest);
    await this.system.start();
  }

  private async startIoServer() {
    // TODO: !!!!????? host config может и не быть
    const hostConfig = await this.loadHostConfig();

    this.ioServer = new IoServer(this.ioSet, hostConfig, console.info, console.error);

    this.ioServer.onShutdownRequest(this.handleShutdownRequest);
    await this.ioServer.start();
  }

  private handleShutdownRequest(reason: ShutdownReason) {
    switch (reason) {
      case 'switchToIoServer':
        if (!this.system) throw new Error(`System isn't set`);

        this.system.destroy()
          .then(this.startIoServer)
          .catch(console.error);
        break;
      case 'switchToApp':
        // TODO: !!!!
        break;
      case 'restart':
        // TODO: !!!!
        break;
    }
  }

}
