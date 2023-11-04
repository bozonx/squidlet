import type {PackageContext} from '../../system/package/PackageContext.js'
import type {PackageIndex} from '../../types/types.js'
import {UiHttpServiceIndex} from '../../services/UiHttpService/UiHttpService.js'
import {UiWsApiServiceIndex} from '../../services/UiWsApiService/UiWsApiService.js'


export function SystemWithUiPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useService(UiWsApiServiceIndex)
    ctx.useService(UiHttpServiceIndex)
  }
}
