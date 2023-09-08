import {PackageContext} from '../../system/package/PackageContext.js'
import {PackageIndex} from '../../types/types.js'
import {UiHttpServiceIndex} from '../../services/UiHttpService/UiHttpService.js'


export function SystemWithUiPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useService(UiHttpServiceIndex)
  }
}
