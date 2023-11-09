import type {IoIndex, PackageIndex} from '../types/types.js'
import type {PackageContext} from '../system/context/PackageContext.js'
import {IoSetBase} from '../base/IoSetBase.js'


export function ioSetLocalPkg (ios: IoIndex[]): PackageIndex {
  return (pkgCtx: PackageContext) => {
    const ioSetLocal = new IoSetLocal(pkgCtx)
    // register all the IO items in IoSet
    for (const io of ios) ioSetLocal.registerIo(io)
    // register IoSet itself
    pkgCtx.useIoSet(ioSetLocal)
  }
}


/**
 * It loads IO set index file where all the used IOs are defined.
 */
export class IoSetLocal extends IoSetBase {
}
