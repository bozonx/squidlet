import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {WsClientIoIndex} from '../../BasicIo/WsClientIo/index.js'
import {WsServerIoIndex} from '../../BasicIo/WsServerIo/index.js'


export function DevSystemPack (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useIo(WsClientIoIndex())
    ctx.useIo(WsServerIoIndex())
  }
}
