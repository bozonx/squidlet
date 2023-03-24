import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, ServiceStatus} from '../../types/types.js'
import {
  EVENT_DELIMITER,
  RootEvents, SERVICE_DESTROY_REASON,
  SERVICE_STATUS, SERVICE_TARGETS, ServiceEvents,
} from '../../types/contstants.js'


export abstract class ServiceBase {
  // list of required drivers
  readonly requireDriver?: string[]
  // TODO: наверное добавить логику что если сервис остановился то этот тоже должен останоиться
  // TODO: так же можно запускать после того как тот сервис запустился
  // TODO: так же можно останавливать только после того как этот сервис остановился
  // list of required services
  readonly required: string[] = [SERVICE_TARGETS.systemInitialized]
  readonly abstract name: string

  private readonly ctx: ServiceContext


  constructor(ctx: ServiceContext) {
    this.ctx = ctx
  }

  async init(cfg?: Record<string, any>) {
    this.changeStatus(SERVICE_STATUS.initializing as ServiceStatus)
  }

  async destroy(reason?: ServiceDestroyReason) {
    if (reason === SERVICE_DESTROY_REASON.noDependencies) {
      // if right now status is registered and was called destroy it means
      // that it doesn't meet some dependencies
      this.changeStatus(SERVICE_STATUS.noDependencies as ServiceStatus)
    }
    else {
      this.changeStatus(SERVICE_STATUS.destroying as ServiceStatus)
    }
  }

  abstract start: () => Promise<void>
  abstract stop: () => Promise<void>
}
