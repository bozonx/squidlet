import IoSet from './interfaces/IoSet';
import System from './System';
import IoServer from './IoServer';
import {ShutdownReason} from './interfaces/ShutdownReason';
import IoItem from './interfaces/IoItem';
import {consoleError} from './lib/helpers';


export default class AppSwitcher {
  private readonly ioSet: IoSet;
  private readonly restartRequest: () => void;
  private system?: System;
  private ioServer?: IoServer;


  constructor(
    ioSet: IoSet,
    restartRequest: () => void,
  ) {
    this.ioSet = ioSet;
    this.restartRequest = restartRequest;
  }


  async start() {
    await this.startSystem();
  }

  destroy = async () => {
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


  private startSystem = async () => {
    this.system = new System(this.ioSet, this.handleShutdownRequest);

    await this.system.start();
  }

  private startIoServer = async () => {
    this.ioServer = new IoServer(
      this.ioSet,
      this.handleShutdownRequest,
      console.info,
      consoleError
    );

    await this.ioServer.start();
  }

  private handleShutdownRequest = (reason: ShutdownReason) => {
    switch (reason) {
      case 'switchToIoServer':
        this.switchToIoServer()
          .catch(consoleError);
        break;
      case 'switchToApp':
        this.switchToApp()
          .catch(consoleError);
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
