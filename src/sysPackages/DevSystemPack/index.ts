import {PackageContext} from '../../system/package/PackageContext.js'
import {Package} from '../../types/Package.js'


export function DevSystemPack (): Package {
  return {
    async install(ctx: PackageContext) {

    },
    async destroy(ctx: PackageContext) {

    },
  }
}
