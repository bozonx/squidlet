import type {ServiceContext} from '../system/context/ServiceContext.js'
import type {ServiceDestroyReason, SubprogramError} from '../types/types.js'
import {SERVICE_TARGETS} from '../types/constants.js'
import type {ServiceProps} from '../types/ServiceProps.js'


export abstract class ServiceBase {
  readonly myName?: string


  props: ServiceProps = {
    required: [SERVICE_TARGETS.systemInitialized],
    restartTries: 0
  }

  protected readonly ctx: ServiceContext
  // call it if running service went to failed state
  private onFall?: (err: SubprogramError) => void


  constructor(ctx: ServiceContext) {
    this.ctx = ctx
  }

  // prepare to start and register specified config
  async init(onFall: (err: SubprogramError) => void, cfg?: Record<string, any>) {
    this.onFall = onFall
  }

  destroy?(reason: ServiceDestroyReason): Promise<void>

  /**
   * Public local api of service.
   * Put here only api which is accessible on local machine.
   * For api which is accessible on network use PublicApiService
   */
  getApi?(): any

  abstract start(): Promise<void>
  abstract stop(force?: boolean): Promise<void>

}
