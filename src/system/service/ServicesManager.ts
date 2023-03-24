import yaml from 'yaml'
import {pathJoin, arraysDifference} from 'squidlet-lib'
import {System} from '../System.js'
import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, ServiceIndex, ServiceStatus, SubprogramError} from '../../types/types.js'
import {ServiceBase} from './ServiceBase.js'
import {
  CFG_DIRS,
  EVENT_DELIMITER,
  RootEvents,
  SERVICE_DESTROY_REASON,
  SERVICE_STATUS,
  ServiceEvents,
} from '../../types/contstants.js'


const SERVICE_CONFIG_FILE_NAME = 'index.yml'


export class ServicesManager {
  private readonly system: System
  private readonly ctx
  private services: Record<string, ServiceBase> = {}
  private statuses: Record<string, ServiceStatus> = {}

  // TODO: наверное добавить логику что если сервис остановился то этот тоже должен останоиться
  // TODO: так же можно запускать после того как тот сервис запустился
  // TODO: так же можно останавливать только после того как этот сервис остановился

  // TODO: что если сервис упал в процессе работы - например он запустил подпроцесс который упал

  // TODO: добавить Taragets
  // TODO: в required может быть зацикленная зависимость

  constructor(system: System) {
    this.system = system
    this.ctx = new ServiceContext(this.system)
  }

  async init() {
    for (const serviceName of Object.keys(this.services)) {
      const service = this.services[serviceName]

      if (service.props.requireDriver) {
        const found: string[] = this.ctx.drivers.getNames().filter((el) => {
          if (service.props.requireDriver?.includes(el)) return true
        })

        if (found.length !== service.props.requireDriver.length) {
          await this.refuseInitService(
            serviceName,
            `No drivers: ${arraysDifference(found, service.props.requireDriver).join()}`
          )

          continue
        }
      }
      else if (service.props.required) {
        const found: string[] = this.getNames().filter((el) => {
          if (service.props.required?.includes(el)) return true
        })

        if (found.length !== service.props.required.length) {
          await this.refuseInitService(
            serviceName,
            `No services: ${arraysDifference(found, service.props.required).join()}`
          )

          continue
        }
      }
      // load service config
      const cfgFilePath = pathJoin(CFG_DIRS.services, serviceName, SERVICE_CONFIG_FILE_NAME)
      let serviceCfg: Record<string, any> | undefined

      if (await this.system.files.cfg.exists(cfgFilePath)) {
        serviceCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
      }

      if (service.init) {
        this.ctx.log.debug(`ServicesManager: initializing service "${serviceName}"`)
        // TODO: добавить таймаут инициализации
        await service.init(
          (err: SubprogramError) => this.handleServiceFall(err, serviceName),
          serviceCfg
        )
      }
    }
  }

  async destroy() {
    // TODO: добавить таймаут дестроя
    for (const serviceName of Object.keys(this.services)) {
      const service = this.services[serviceName]

      if (service.destroy) {
        this.ctx.log.debug(`ServicesManager: destroying service "${serviceName}"`)
        this.changeStatus(serviceName, SERVICE_STATUS.destroying as ServiceStatus)
        await service.destroy(SERVICE_DESTROY_REASON.systemDestroying as ServiceDestroyReason)
        this.changeStatus(serviceName, SERVICE_STATUS.destroyed as ServiceStatus)
      }
    }
  }


  getService<T extends ServiceBase>(serviceName: string): T {
    return this.services[serviceName] as T
  }

  getNames(): string[] {
    return Object.keys(this.services)
  }

  getServiceStatus(serviceName: string): ServiceStatus {

  }

  async startAll() {

    // TODO: сервисы могут инициализироваться друг за другом в заданном порядке. тоже с дестроем

    // TODO: если сервис не запустился то не поднимать ошибку выше, писать в лог
    // TODO: запускать только те сервисы которые помеченны для запуска
    // TODO: выстраивать порядок запуска
  }

  async startService() {
    // TODO: добавить таймаут старта
  }

  async stopService() {
    // TODO: добавить таймаут остановки
  }

  useService(serviceIndex: ServiceIndex) {
    const service = serviceIndex(this.ctx)

    this.services[service.name] = service
  }


  private changeStatus(serviceName: string, newStatus: ServiceStatus) {
    this.statuses[serviceName] = newStatus
    this.ctx.events.emit(this.makeEventName(serviceName, ServiceEvents.status), newStatus)
  }

  private makeEventName(serviceName: string, eventName: ServiceEvents): string {
    return RootEvents.service + EVENT_DELIMITER +
      serviceName + EVENT_DELIMITER
      + eventName
  }

  private async refuseInitService(serviceName: string, reason: string) {
    await this.services[serviceName]
      .destroy?.(SERVICE_DESTROY_REASON.noDependencies as ServiceDestroyReason)
    // do not register the driver if ot doesn't meet his dependencies
    delete this.services[serviceName]
    //this.changeStatus(SERVICE_STATUS.noDependencies as ServiceStatus)
    this.ctx.log.error(`Failed initializing service "${serviceName}": ${reason}`)
  }

  private handleServiceFall(err: SubprogramError, serviceName: string) {
    // TODO: add
  }

}
