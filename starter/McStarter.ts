import {SystemClassType} from '../shared/interfaces/SystemClassType';
import IoSetLocal from './IoSetLocal';
import IoSet from '../system/interfaces/IoSet';
import IoServer from '../shared/IoServer';
import StorageIo from '../system/interfaces/io/StorageIo';
import systemConfig from '../system/config/systemConfig';
import {IO_SERVER_MODE_FILE_NAME} from '../system/constants';
import HostConfig from '../system/interfaces/HostConfig';
import InitializationConfig from '../system/interfaces/InitializationConfig';
import initializationConfig from '../system/config/initializationConfig';
import {pathJoin} from '../system/lib/nodeLike';


class McStarter {
  private pathToBundle: string;
  private readonly ioSet: IoSet;


  constructor(pathToBundle = `${systemConfig.rootDirs.envSet}/${systemConfig.envSetDirs.system}/System`) {
    this.pathToBundle = pathToBundle;
    this.ioSet = new IoSetLocal();
  }


  async start() {
    if (await this.isIoServerMode()) {
      await this.startIoServer();
    }
    else {
      await this.startSystem();
    }
  }


  private async isIoServerMode(): Promise<boolean> {

    // TODO: не будет рабоать пока не будет выполнен ioSet.init() !!!!

    const storage = this.ioSet.getIo<StorageIo>('Storage');

    return storage.exists(this.getMarkFilePath());
  }

  private async startSystem() {
    const SystemClass: SystemClassType = require(this.pathToBundle).default;
    const system = new SystemClass(this.ioSet);

    await system.start();
  }

  private async startIoServer() {
    const storage = this.ioSet.getIo<StorageIo>('Storage');
    // remove mark file first
    await storage.unlink(this.getMarkFilePath());

    const hostConfig = await this.loadHostConfig();
    const ioServer = new IoServer(this.ioSet, hostConfig, console.info, console.error);

    await ioServer.init();
  }

  private getMarkFilePath(): string {
    return `${systemConfig.rootDirs.tmp}/${IO_SERVER_MODE_FILE_NAME}`;
  }

  private async loadHostConfig(): Promise<HostConfig> {
    const initCfg: InitializationConfig = initializationConfig();
    const pathToConfig = pathJoin(
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.configs,
      initCfg.fileNames.hostConfig
    );

    const storage = this.ioSet.getIo<StorageIo>('Storage');
    const configStr: string = await storage.readFile(pathToConfig);

    return JSON.parse(configStr);
  }

}
