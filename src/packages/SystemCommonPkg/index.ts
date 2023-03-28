import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {FilesDriverIndex} from '../../drivers/FilesDriver/FilesDriver.js'
//import {WsClientDriver} from '../../drivers/WsClientDriver/index.js'
//import {WsServerDriver} from '../../drivers/WsServerDriver/index.js'


export function SystemCommonPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useDriver(FilesDriverIndex)
    //ctx.useDriver(WsClientDriver())
    //ctx.useDriver(WsServerDriver())
  }
}
