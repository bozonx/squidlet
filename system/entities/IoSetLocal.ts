import IoSet from '../interfaces/IoSet';
import IoItem from '../interfaces/IoItem';
import System from '../System';
import {pathJoin} from '../helpers/nodeLike';


export default class IoSetLocal implements IoSet {
  private ioCollection: {[index: string]: IoItem} = {};


  /**
   * Load ioSet index.js file where included all the used io on platform
   */
  async init(system: System): Promise<void> {
    const pathToIoSetIndex = pathJoin(
      system.systemConfig.rootDirs.envSet,
      system.systemConfig.envSetDirs.ios,
    );

    // Load io collection workDir/io/index.js
    const ioClasses: {[index: string]: new () => IoItem} = require(pathToIoSetIndex);

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

}
