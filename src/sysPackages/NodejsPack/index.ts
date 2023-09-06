import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {HttpClientIoIndex} from './ios/HttpClientIo.js'
import {HttpServerIoIndex} from './ios/HttpServerIo.js'
import {WsClientIoIndex} from './ios/WsClientIo.js'
import {WsServerIoIndex} from './ios/WsServerIo.js'


export function NodejsPack (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useIo(HttpClientIoIndex)
    ctx.useIo(HttpServerIoIndex)
    ctx.useIo(WsClientIoIndex)
    ctx.useIo(WsServerIoIndex)
  }
}
