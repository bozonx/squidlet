import type {PackageContext} from '../../system/package/PackageContext.js'
import type {PackageIndex} from '../../types/types.js'
import {FilesDriverIndex} from '../../drivers/FilesDriver/FilesDriver.js'
import {HttpServerDriverIndex} from '../../drivers/HttpServerDriver/HttpServerDriver.js'
import {HttpClientDriverIndex} from '../../drivers/HttpClientDriver/HttpClientDriver.js'
import {WsClientDriverIndex} from '../../drivers/WsClientDriver/WsClientDriver.js'
import {WsServerDriverIndex} from '../../drivers/WsServerDriver/WsServerDriver.js'


export function SystemCommonPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useDriver(FilesDriverIndex)
    ctx.useDriver(HttpClientDriverIndex)
    ctx.useDriver(HttpServerDriverIndex)
    ctx.useDriver(WsClientDriverIndex)
    ctx.useDriver(WsServerDriverIndex)
  }
}
