import IoSetLocal from './IoSetLocal';
import IoSet from './interfaces/IoSet';
import AppSwitcher from './AppSwitcher';
import SysIo from './interfaces/io/SysIo';
import {consoleError} from './lib/helpers';


/**
 * Starter for micro-controllers.
 */
class McStarter {
  private readonly ioSet: IoSet;
  private readonly appSwitcher: AppSwitcher;


  constructor() {
    this.ioSet = new IoSetLocal();
    this.appSwitcher = new AppSwitcher(this.ioSet, this.onRestartRequest);
  }


  async start() {
    await this.appSwitcher.start();

    // TODO: ??? init ioSet ??
    // TODO: ??? configure ioSet with config ??
  }


  private onRestartRequest = () => {
    const sysIo = this.ioSet.getIo<SysIo>('Sys');

    sysIo.reboot()
      .catch(consoleError);
  }

}

//
// private async isIoServerMode(): Promise<boolean> {
//
//   // T-O-D-O: не будет рабоать пока не будет выполнен ioSet.init() !!!!
//
//   const storage = this.ioSet.getIo<StorageIo>('Storage');
//
//   return storage.exists(this.getMarkFilePath());
// }

// private async startIoServer() {
//   const storage = this.ioSet.getIo<StorageIo>('Storage');
//   // remove mark file first
//   await storage.unlink(this.getMarkFilePath());
//
//   const hostConfig = await this.loadHostConfig();
//   const ioServer = new IoServer(this.ioSet, hostConfig, console.info, console.error);
//
//   await ioServer.init();
// }

// private getMarkFilePath(): string {
//   return `${systemConfig.rootDirs.tmp}/${IO_SERVER_MODE_FILE_NAME}`;
// }

// private async loadHostConfig(): Promise<HostConfig> {
//   const initCfg: InitializationConfig = initializationConfig();
//   const pathToConfig = pathJoin(
//     systemConfig.rootDirs.envSet,
//     systemConfig.envSetDirs.configs,
//     initCfg.fileNames.hostConfig
//   );
//
//   const storage = this.ioSet.getIo<StorageIo>('Storage');
//   const configStr: string = await storage.readFile(pathToConfig);
//
//   return JSON.parse(configStr);
// }
