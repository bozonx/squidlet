import {PackageContext} from '../../system/package/PackageContext.js'
import {Package} from '../../types/types.js'
import {WsClientDriver} from '../../drivers/WsClientDriver/index.js'
import {WsServerDriver} from '../../drivers/WsServerDriver/index.js'


export function SystemCommonPkg (): Package {
  return (ctx: PackageContext) => {
    ctx.useDriver(WsClientDriver())
    ctx.useDriver(WsServerDriver())
  }
}
