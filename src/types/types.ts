import {PackageContext} from '../system/package/PackageContext.js'
import {DriverContext} from '../system/driver/DriverContext.js'


// It is called right after it is set to system via use()
// That means very early, before system.init()
export type Package = (ctx: PackageContext) => void
export type Driver = (ctx: DriverContext) => void
