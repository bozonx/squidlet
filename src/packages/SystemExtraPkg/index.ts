import type {PackageContext} from '../../system/context/PackageContext.js'
import type {PackageIndex} from '../../types/types.js'
import {CtrlServiceIndex} from '../../services/CtrlService/CtrlService.js'


export function SystemExtraPkg (): PackageIndex {
  return (ctx: PackageContext) => {
    ctx.useService(CtrlServiceIndex)
  }
}
