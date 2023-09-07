import {IoIndex, PackageIndex} from '../types/types.js'
import {PackageContext} from '../system/package/PackageContext.js'
import {IoSetBase} from '../system/Io/IoSetBase.js'


export function ioSetLocalPkg (ios: IoIndex[]): PackageIndex {
  return (pkgCtx: PackageContext) => {
    const ioSetLocal = new IoSetLocal(pkgCtx)

    for (const io of ios) {
      ioSetLocal.registerIo(io)
    }

    pkgCtx.useIoSet(ioSetLocal)
  }
}


/**
 * It loads IO set index file where all the used IOs are defined.
 */
export class IoSetLocal extends IoSetBase {
  /**
   * Load ioSet index.js file where included all the used platforms on platform.
   * It will be called on system start
   */
  async init(): Promise<void> {
    super.init()
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


  registerIo(ioItem: IoIndex): Promise<void> {
    // TODO: нужен io context
  }


  // it is need for test purpose
  // private requireIoSetIndex(pathToIoSetIndex: string): {[index: string]: new () => IoItem} {
  //   return require(pathToIoSetIndex);
  // }

}
