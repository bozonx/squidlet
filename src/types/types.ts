import {PackageContext} from '../system/package/PackageContext.js'


// It is called right after it is set to system via use()
// That means very early, before system.init()
export type Package = (ctx: PackageContext) => void
