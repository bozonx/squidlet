import {PackageContext} from '../system/package/PackageContext.js'
import {DriverContext} from '../system/driver/DriverContext.js'
import {DriverBase} from '../system/driver/DriverBase.js'


// It is called right after it is set to system via use()
// That means very early, before system.init()
export type PackageIndex = (ctx: PackageContext) => void
export type DriverIndex = (ctx: DriverContext) => DriverBase
