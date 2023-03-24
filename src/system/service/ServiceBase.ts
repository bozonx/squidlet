import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, SubprogramError} from '../../types/types.js'
import {SERVICE_TARGETS} from '../../types/contstants.js'
import {ServiceProps} from '../../types/ServiceProps.js'


export abstract class ServiceBase {
  readonly abstract name: string

  private props: ServiceProps = {
    required: [SERVICE_TARGETS.systemInitialized],
    restartTries: 0
  }

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
