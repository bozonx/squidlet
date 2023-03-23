import {ServiceContext} from './ServiceContext.js'
import {ServiceStatus} from '../../types/types.js'
import {
  EVENT_DELIMITER,
  RootEvents,
  SERVICE_STATUS, ServiceEvents,
} from '../../types/contstants.js'


export abstract class ServiceBase {
  readonly requireDriver?: string[]
  readonly abstract name: string
  private status = SERVICE_STATUS.registered as ServiceStatus

  // TODO: сервисы могут инициализироваться друг за другом в заданном порядке. тоже с дестроем
  // startAfter?: string[]
  // startBefore?: string[]
  // destroyAfter?: string[]
  // destroyBefore?: string[]

  private readonly ctx: ServiceContext


  constructor(ctx: ServiceContext) {
    this.ctx = ctx
  }

  async init(cfg?: Record<string, any>) {
    this.changeStatus(SERVICE_STATUS.initializing as ServiceStatus)
  }

  async destroy() {
    this.changeStatus(SERVICE_STATUS.destroying as ServiceStatus)
  }


  start() {
    this.changeStatus(SERVICE_STATUS.starting as ServiceStatus)
  }

  stop() {
    this.changeStatus(SERVICE_STATUS.stopping as ServiceStatus)
  }


  protected changeStatus(newStatus: ServiceStatus) {
    this.status = newStatus
    this.ctx.events.emit(this.makeEventName(ServiceEvents.status), newStatus)
  }

  protected makeEventName(eventName: ServiceEvents): string {
    return RootEvents.service + EVENT_DELIMITER +
      this.name + EVENT_DELIMITER
      + eventName
  }

}
