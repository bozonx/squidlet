import type {PackageContext} from '../system/package/PackageContext.js'
import type {DriverContext} from '../system/driver/DriverContext.js'
import type {DriverBase} from '../system/driver/DriverBase.js'
import type {IoBase} from '../system/Io/IoBase.js'
import type {ServiceBase} from '../system/service/ServiceBase.js'
import type {ServiceContext} from '../system/service/ServiceContext.js'
import type {IoContext} from '../system/Io/IoContext.js'
import type {SERVICE_DESTROY_REASON, SERVICE_STATUS} from './contstants.js'
import {AppContext} from '../system/application/AppContext.js'
import type {AppBase} from '../system/application/AppBase.js'


// It is called right after it is set to system via use()
// That means very early, before system.init()
export type PackageIndex = (ctx: PackageContext) => void
export type IoIndex = (ctx: IoContext) => IoBase
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
