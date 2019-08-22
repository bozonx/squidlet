import {SystemClassType} from '../shared/interfaces/SystemClassType';
import IoSetLocal from '../system/IoSetLocal';
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


  constructor(pathToBundle = `${systemConfig.rootDirs.envSet}/${systemConfig.envSetDirs.system}/System`) {
    this.pathToBundle = pathToBundle;
  }


  async start() {
    const ioSet = new IoSetLocal();

    if (await this.isIoServerMode(ioSet)) {
      await this.startIoServer(ioSet);
    }
    else {
      await this.startSystem(ioSet);
    }
  }


  private async isIoServerMode(ioSet: IoSet): Promise<boolean> {
    const storage = ioSet.getIo<StorageIo>('Storage');

    return storage.exists(this.getMarkFilePath());
  }

  private async startSystem(ioSet: IoSet) {
    const SystemClass: SystemClassType = require(this.pathToBundle).default;
    const system = new SystemClass(ioSet);

    await system.start();
  }

  private async startIoServer(ioSet: IoSet) {
    const storage = ioSet.getIo<StorageIo>('Storage');
    // remove mark file first
    await storage.unlink(this.getMarkFilePath());

    const hostConfig = await this.loadHostConfig();
    const ioServer = new IoServer(ioSet, hostConfig);

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


  // private resolveIoSet(specifiedIoSet?: IoSet): IoSet {
  //   // use specified IO set if it is set
  //   if (specifiedIoSet) return specifiedIoSet;
  //
  //   // use local IO set by default
  //   return new IoSetLocal();
  // }

}
