import {PackageContext} from '../system/package/PackageContext.js'


export interface Package {
  install: (ctx: PackageContext) => Promise<void>
  destroy?: (ctx: PackageContext) => Promise<void>
}
