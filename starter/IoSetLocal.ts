import IoSet from '../system/interfaces/IoSet';
import IoItem from '../system/interfaces/IoItem';
import {pathJoin} from '../system/lib/nodeLike';
import Context from '../system/Context';


export default class IoSetLocal implements IoSet {
  private ioCollection: {[index: string]: IoItem} = {};


  /**
   * Load ioSet index.js file where included all the used io on platform.
   * It will be called on system start
   */
  async init(context: Context): Promise<void> {
    const pathToIoSetIndex = pathJoin(
      context.systemConfig.rootDirs.envSet,
      context.systemConfig.envSetDirs.ios,
    );

    // Load io collection workDir/io/index.js
    const ioClasses = this.requireIoSetIndex(pathToIoSetIndex);

    // make dev instances
    for (let ioName of Object.keys(ioClasses)) {
      this.ioCollection[ioName] = new ioClasses[ioName]();
    }
  }

  async destroy() {
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


  // it is need for test purpose
  private requireIoSetIndex(pathToIoSetIndex: string): {[index: string]: new () => IoItem} {
    return require(pathToIoSetIndex);
  }

}
