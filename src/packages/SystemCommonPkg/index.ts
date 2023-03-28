import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {FilesDriverIndex} from '../../drivers/FilesDriver/FilesDriver.js'


export function SystemCommonPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useDriver(FilesDriverIndex)
  }
}
