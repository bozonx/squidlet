import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {FilesIoIndex} from './Ios/FilesIo.js'
import {SysHaltIoIndex} from './Ios/SysHaltIo.js'
import {SysInfoIoIndex} from './Ios/SysInfoIo.js'


export function LinuxX86SystemPack (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useIo(SysHaltIoIndex)
    ctx.useIo(SysInfoIoIndex)
    ctx.useIo(FilesIoIndex)
  }
}
