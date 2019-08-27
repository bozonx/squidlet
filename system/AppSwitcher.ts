import IoSet from './interfaces/IoSet';
import System from './System';
import IoServer from './IoServer';
import {ShutdownReason} from './interfaces/ShutdownReason';


export type AppSwitcherClass = new (
  ioSet: IoSet,
  restartRequest: () => void,
  systemConfigExtend?: {[index: string]: any}
) => AppSwitcher;


export default class AppSwitcher {
  private readonly ioSet: IoSet;
  private readonly restartRequest: () => void;
  private readonly systemConfigExtend?: {[index: string]: any};
  private system?: System;
  private ioServer?: IoServer;


  constructor(
    ioSet: IoSet,
    restartRequest: () => void,
    systemConfigExtend?: {[index: string]: any}
  ) {
    this.ioSet = ioSet;
    this.restartRequest = restartRequest;
    this.systemConfigExtend = systemConfigExtend;
  }


  async start() {
    await this.startSystem();
  }

  async destroy() {
    if (this.system) {
      await this.system.destroy();
    }
    else if (this.ioServer) {
      await this.ioServer.destroy();
    }
  }


  private startSystem = async () => {
    this.system = new System(this.ioSet, this.handleShutdownRequest, this.systemConfigExtend);

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
