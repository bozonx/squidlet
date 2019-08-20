import {SystemClassType} from '../shared/interfaces/SystemClassType';
import IoSetLocal from '../system/IoSetLocal';
import IoSet from '../system/interfaces/IoSet';
import IoServer from '../shared/IoServer';
import StorageIo from '../system/interfaces/io/StorageIo';
import systemConfig from '../system/config/systemConfig';


const MODE_MARK_FILE_NAME = 'ioserver';


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
    const markFilePath = `${systemConfig.rootDirs.tmp}/${MODE_MARK_FILE_NAME}`;

    return storage.exists(markFilePath);
  }

  private async startSystem(ioSet: IoSet) {
    const SystemClass: SystemClassType = require(this.pathToBundle).default;
    const system = new SystemClass(ioSet);

    await system.start();
  }

  private async startIoServer(ioSet: IoSet) {
    const ioServer = new IoServer(ioSet);

    await ioServer.init();
  }


  // private resolveIoSet(specifiedIoSet?: IoSet): IoSet {
  //   // use specified IO set if it is set
  //   if (specifiedIoSet) return specifiedIoSet;
  //
  //   // use local IO set by default
  //   return new IoSetLocal();
  // }

}
