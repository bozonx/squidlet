import type {PackageContext} from '../../system/context/PackageContext.js'
import type {PackageIndex} from '../../types/types.js'
import {FilesDriverIndex} from '../../drivers/FilesDriver/FilesDriver.js'
import {HttpServerDriverIndex} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {HttpClientDriverIndex} from '../../drivers/HttpClientDriver/HttpClientDriver.js'
import {WsClientDriverIndex} from '../../drivers/WsClientDriver/WsClientDriver.js'
import {WsServerDriverIndex} from '../../drivers/WsServerDriver/WsServerDriver.js'
import {NetworkServiceIndex} from '../../services/Network/NetworkService.js'
import {PublicApiServiceIndex} from '../../services/PublicApiService/PublicApiService.js'
import {SessionsServiceIndex} from '../../services/Sessions/SessionsService.js'


export function SystemCommonPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useDriver(FilesDriverIndex)
    ctx.useDriver(HttpClientDriverIndex)
    ctx.useDriver(HttpServerDriverIndex)
    ctx.useDriver(WsClientDriverIndex)
    ctx.useDriver(WsServerDriverIndex)
    ctx.useService(NetworkServiceIndex)
    ctx.useService(PublicApiServiceIndex)
    ctx.useService(SessionsServiceIndex)
  }
}
