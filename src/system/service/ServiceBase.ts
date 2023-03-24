import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, SubprogramError} from '../../types/types.js'
import {SERVICE_TARGETS} from '../../types/contstants.js'


export abstract class ServiceBase {
  // list of required drivers
  readonly requireDriver?: string[]
  // list of required services. It means:
  // * if required service is not installed then this service will not be used
  // * if required service has just started then this service will be started
  // * if required service has just gone to failed state then this service will be stopped
  // * if required service has just stopped then this service will be stopped
  // * if required service has just destroyed then this service will be destroyed
  readonly required: string[] = [SERVICE_TARGETS.systemInitialized]
  readonly abstract name: string

  private readonly ctx: ServiceContext
  // call it if running service went to failed state
  private onFall?: (err: SubprogramError) => void


  constructor(ctx: ServiceContext) {
    this.ctx = ctx
  }

  // prepare to start and register specified config
  async init(onFall: (err: SubprogramError) => void, cfg?: Record<string, any>) {
    this.onFall = onFall
  }

  destroy?: (reason?: ServiceDestroyReason) => Promise<void>

  abstract start: () => Promise<void>
  abstract stop: (force?: boolean) => Promise<void>

}
