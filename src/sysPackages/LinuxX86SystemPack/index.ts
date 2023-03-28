import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {FilesIoIndex} from './Ios/FilesIo.js'


export function LinuxX86SystemPack (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useIo(FilesIoIndex)
  }
}
