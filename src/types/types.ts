import type {PackageContext} from '../system/context/PackageContext.js'
import type {DriverContext} from '../system/context/DriverContext.js'
import type {DriverBase} from '../base/DriverBase.js'
import type {IoBase} from '../base/IoBase.js'
import type {ServiceBase} from '../base/ServiceBase.js'
import type {ServiceContext} from '../system/context/ServiceContext.js'
import type {IoContext} from '../system/context/IoContext.js'
import type {SERVICE_DESTROY_REASON, SERVICE_STATUS} from './constants.js'
import {AppContext} from '../system/context/AppContext.js'
import type {AppBase} from '../base/AppBase.js'


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
