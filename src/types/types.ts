import {PackageContext} from '../system/package/PackageContext.js'
import {DriverContext} from '../system/driver/DriverContext.js'
import {DriverBase} from '../system/driver/DriverBase.js'
import {IoBase} from '../system/Io/IoBase.js'
import {ServiceBase} from '../system/service/ServiceBase.js'
import {ServiceContext} from '../system/service/ServiceContext.js'
import {IoContext} from '../system/Io/IoContext.js'
import {SERVICE_DESTROY_REASON, SERVICE_STATUS} from './contstants.js'
import {AppContext} from '../system/application/AppContext.js'
import {AppBase} from '../system/application/AppBase.js'


// It is called right after it is set to system via use()
// That means very early, before system.init()
export type PackageIndex = (ctx: PackageContext) => void
//export type IoIndex = (ctx: IoContext) => IoBase
export type DriverIndex = (ctx: DriverContext) => DriverBase
export type ServiceIndex = (ctx: ServiceContext) => ServiceBase
export type AppIndex = () => AppBase
export type ServiceStatus = keyof typeof SERVICE_STATUS
export type ServiceDestroyReason = keyof typeof SERVICE_DESTROY_REASON
export type PermissionFileType = 'r' | 'w'

export interface SubprogramError {
  code: number,
  codeText: string,
  errorText: string,
}
