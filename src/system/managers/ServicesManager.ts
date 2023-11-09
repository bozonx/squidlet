import {arraysDifference} from 'squidlet-lib'
import type {System} from '../System.js'
import {ServiceContext} from '../context/ServiceContext.js'
import type {ServiceDestroyReason, ServiceIndex, ServiceStatus, SubprogramError} from '../../types/types.js'
import type {ServiceBase} from '../../base/ServiceBase.js'
import {
  EVENT_DELIMITER,
  RootEvents,
  SERVICE_DESTROY_REASON,
  SERVICE_STATUS,
  ServiceEvents,
} from '../../types/constants.js'


//const SERVICE_CONFIG_FILE_NAME = 'index.yml'


export class ServicesManager {
  private readonly system: System
  private readonly ctx
  private services: Record<string, ServiceBase> = {}
  private statuses: Record<string, ServiceStatus> = {}

  // TODO: наверное добавить логику что если один сервис остановился то этот тоже должен останоиться
  // TODO: так же можно останавливать только после того как этот сервис остановился
  // TODO: если сервис упад - статус fallen - нужно остановить
  //       все сервисы у которых он в required

  // TODO: добавить Taragets
  // TODO: в required может быть зацикленная зависимость - тогда
  //       переводить в ошибочный сетйт и не запускать

  // TODO: use restartTries

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
      const serviceCfg: Record<string, any> | undefined = await this.system.configs
          .loadServiceConfig(serviceName)
      // const cfgFilePath = pathJoin(SYSTEM_SUB_DIRS.services, serviceName, SERVICE_CONFIG_FILE_NAME)
      // let serviceCfg: Record<string, any> | undefined
      //
      // if (await this.system.files.cfg.exists(cfgFilePath)) {
      //   serviceCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
      // }

      if (service.init) {
        this.ctx.log.debug(`ServicesManager: initializing service "${serviceName}"`)
        // TODO: добавить таймаут инициализации
        this.changeStatus(serviceName, SERVICE_STATUS.initializing as ServiceStatus)

        try {
          await service.init(
            (err: SubprogramError) => this.handleServiceFall(err, serviceName),
            serviceCfg
          )
        }
        catch (e) {
          this.ctx.log.error(`ServicesManager: service "${serviceName}" init error: ${e}`)
          this.changeStatus(serviceName, SERVICE_STATUS.initError as ServiceStatus)

          return
        }

        this.changeStatus(serviceName, SERVICE_STATUS.initialized as ServiceStatus)
      }
    }
  }

  async destroy() {
    for (const serviceName of Object.keys(this.services)) {
      const service = this.services[serviceName]

      if (service.destroy) {
        this.ctx.log.debug(`ServicesManager: destroying service "${serviceName}"`)
        this.changeStatus(serviceName, SERVICE_STATUS.destroying as ServiceStatus)

        // TODO: добавить таймаут дестроя
        // TODO: наверное сделать в порядке required

        try {
          await service.destroy(SERVICE_DESTROY_REASON.systemDestroying as ServiceDestroyReason)
        }
        catch (e) {
          this.ctx.log.error(`Service "${serviceName} destroying with error: ${e}"`)
          // then ignore an error
        }

        this.changeStatus(serviceName, SERVICE_STATUS.destroyed as ServiceStatus)
      }
    }
  }


  getService<T extends ServiceBase>(serviceName: string): T {
    return this.services[serviceName] as T
  }

  getServiceApi<T = Record<string, any>>(serviceName: string): T | undefined {
    return this.services[serviceName]?.getApi?.()
  }

  getNames(): string[] {
    return Object.keys(this.services)
  }

  getServiceStatus(serviceName: string): ServiceStatus {
    return this.statuses[serviceName]
  }

  async startAll() {
    for (const serviceName of Object.keys(this.services)) {
      await this.startService(serviceName)
    }
  }

  async startService(serviceName: string) {

    // TODO: так же можно запускать после того как тот сервис запустился
    // TODO: наверное все сервисы сразу ставить в режим ожидания
    //       и сразу запустить initTarget и за ним должна запуститься вся цепочка

    // TODO: запускать только те сервисы которые помеченны для запуска - enabled

    const service = this.services[serviceName]

    if (service.props.required) {
      const runningRequired: string[] = service.props.required.filter((srvName: string) => {
        if (this.statuses[srvName] === SERVICE_STATUS.running as ServiceStatus) return true
      })

      if (runningRequired.length === service.props.required.length) {
        await this.startServiceRightNow(serviceName)
      }
      else {
        this.changeStatus(serviceName, SERVICE_STATUS.wait as ServiceStatus)

        const evenName = this.makeEventName(ServiceEvents.status)
        const handlerIndex = this.ctx.events.addListener(evenName, () => {
          const runningRequired: string[] = service.props.required.filter((srvName: string) => {
            if (this.statuses[srvName] === SERVICE_STATUS.running as ServiceStatus) return true
          })

          if (runningRequired.length === service.props.required.length) {
            this.ctx.events.removeListener(handlerIndex, evenName)
            this.startServiceRightNow(serviceName)
              .catch((e) => this.ctx.log.error(e))
          }
        })
      }
    }
  }

  async stopService(serviceName: string, force?: boolean) {
    // TODO: добавить таймаут остановки - stopTimeoutSec

    this.changeStatus(serviceName, SERVICE_STATUS.stopping as ServiceStatus)

    try {
      await this.services[serviceName].stop(force)
    }
    catch (e) {
      this.ctx.log.error(`ServicesManager: service "${serviceName}" stop error: ${e}`)
      this.changeStatus(serviceName, SERVICE_STATUS.stopError as ServiceStatus)

      return
    }

    this.changeStatus(serviceName, SERVICE_STATUS.stopped as ServiceStatus)
  }

  useService(serviceIndex: ServiceIndex) {
    const service = serviceIndex(this.ctx)
    const serviceName: string = service.myName || service.constructor.name

    if (this.services[serviceName]) {
      throw new Error(`The same service "${serviceName} is already in use"`)
    }

    this.services[serviceName] = service

    this.changeStatus(serviceName, SERVICE_STATUS.loaded as ServiceStatus)
  }


  private async startServiceRightNow(serviceName: string) {

    // TODO: добавить таймаут старта - use startTimeoutSec
    // TODO: use waitBeforeStartSec - и проверить ещё раз условия


    this.changeStatus(serviceName, SERVICE_STATUS.starting as ServiceStatus)

    try {
      await this.services[serviceName].start()
    }
    catch (e) {
      this.ctx.log.error(`ServicesManager: service "${serviceName}" start error: ${e}`)
      this.changeStatus(serviceName, SERVICE_STATUS.startError as ServiceStatus)

      return
    }

    this.changeStatus(serviceName, SERVICE_STATUS.running as ServiceStatus)
  }

  private changeStatus(serviceName: string, newStatus: ServiceStatus) {
    this.statuses[serviceName] = newStatus
    this.ctx.events.emit(this.makeEventName(ServiceEvents.status), serviceName, newStatus)
  }

  private makeEventName(eventName: ServiceEvents): string {
    return RootEvents.service + EVENT_DELIMITER + eventName
  }

  private async refuseInitService(serviceName: string, reason: string) {
    await this.services[serviceName]
      .destroy?.(SERVICE_DESTROY_REASON.noDependencies as ServiceDestroyReason)
    // do not register the driver if ot doesn't meet his dependencies
    delete this.services[serviceName]
    // service will be deleted but status was saved
    this.changeStatus(serviceName, SERVICE_STATUS.noDependencies as ServiceStatus)
    this.ctx.log.error(`Failed initializing service "${serviceName}": ${reason}`)
  }

  private handleServiceFall(err: SubprogramError, serviceName: string) {
    this.ctx.log.error(`Service "${serviceName}" has gone to failed state: ${JSON.stringify(err)}`)
    this.changeStatus(serviceName, SERVICE_STATUS.fallen as ServiceStatus)
  }

}
