import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {FilesIoIndex} from '../LinuxX86SystemPack/Ios/FilesIo.js'
import {SysHaltIoIndex} from '../LinuxX86SystemPack/Ios/SysHaltIo.js'
import {SysInfoIoIndex} from '../LinuxX86SystemPack/Ios/SysInfoIo.js'


export function DevSystemPack (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useIo(SysHaltIoIndex)
    ctx.useIo(SysInfoIoIndex)
    ctx.useIo(FilesIoIndex)
  }
}
