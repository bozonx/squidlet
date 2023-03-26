import IoSet from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoSet.js';
import IoItem from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/interfaces/IoItem.js';
import {pathJoin} from '../../../squidlet-lib/src/paths';
import systemConfig from '../../../../../../../mnt/disk2/workspace/squidlet/__old/system/systemConfig.js';


/**
 * It loads IO set index file where all the used IOs are defined.
 */
export default class IoSetLocal implements IoSet {
  private ioCollection: {[index: string]: IoItem} = {};


  /**
   * Load ioSet index.js file where included all the used platforms on platform.
   * It will be called on system start
   */
  async init(): Promise<void> {
    // TODO: use workDir
    const pathToIoSetIndex = pathJoin(
      '/',
      systemConfig.rootDirs.envSet,
      systemConfig.envSetDirs.ios,
    );

    // Load platforms collection workDir/platforms/index.js
    const ioClasses = this.requireIoSetIndex(pathToIoSetIndex);

    // make dev instances
    for (let ioName of Object.keys(ioClasses)) {
      this.ioCollection[ioName] = new ioClasses[ioName]();
    }
  }

  async destroy() {
    // destroy of ios
    const ioNames: string[] = this.getNames();

    for (let ioName of ioNames) {
      const ioItem: IoItem = this.getIo(ioName);

      if (ioItem.destroy) await ioItem.destroy();
    }

    delete this.ioCollection;
  }


  getIo<T extends IoItem>(ioName: string): T {
    if (!this.ioCollection[ioName]) {
      throw new Error(`Can't find io instance "${ioName}"`);
    }

    return this.ioCollection[ioName] as T;
  }

  getNames(): string[] {
    return Object.keys(this.ioCollection);
  }

  async requireLocalFile(fileName: string): Promise<any> {
    return require(fileName);
  }


  // it is need for test purpose
  private requireIoSetIndex(pathToIoSetIndex: string): {[index: string]: new () => IoItem} {
    return require(pathToIoSetIndex);
  }

}
