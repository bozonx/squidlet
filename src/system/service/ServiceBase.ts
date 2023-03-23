import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, ServiceStatus} from '../../types/types.js'
import {
  EVENT_DELIMITER,
  RootEvents, SERVICE_DESTROY_REASON,
  SERVICE_STATUS, ServiceEvents,
} from '../../types/contstants.js'


export abstract class ServiceBase {
  // list of required drivers
  readonly requireDriver?: string[]
  // list of required services
  readonly required?: string[]
  readonly abstract name: string

  // TODO: может управление статусом вынести в мэнеджер ???
  private currentStatus = SERVICE_STATUS.registered as ServiceStatus

  // startAfter?: string[]
  // startBefore?: string[]
  // destroyAfter?: string[]
  // destroyBefore?: string[]

  private readonly ctx: ServiceContext


  get status(): ServiceStatus {
    return this.currentStatus
  }


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


  start() {
    this.changeStatus(SERVICE_STATUS.starting as ServiceStatus)
  }

  stop() {
    this.changeStatus(SERVICE_STATUS.stopping as ServiceStatus)
  }


  protected changeStatus(newStatus: ServiceStatus) {
    this.currentStatus = newStatus
    this.ctx.events.emit(this.makeEventName(ServiceEvents.status), newStatus)
  }

  protected makeEventName(eventName: ServiceEvents): string {
    return RootEvents.service + EVENT_DELIMITER +
      this.name + EVENT_DELIMITER
      + eventName
  }

}
