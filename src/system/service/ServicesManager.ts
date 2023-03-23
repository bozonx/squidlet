import yaml from 'yaml'
import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {ServiceContext} from './ServiceContext.js'
import {ServiceDestroyReason, ServiceIndex} from '../../types/types.js'
import {ServiceBase} from './ServiceBase.js'
import {CFG_DIRS, SERVICE_DESTROY_REASON} from '../../types/contstants.js'


const SERVICE_CONFIG_FILE_NAME = 'index.yml'


export class ServicesManager {
  private readonly system: System
  private services: Record<string, ServiceBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new ServiceContext(this.system)
  }

  async init() {
    for (const serviceName of Object.keys(this.services)) {
      const service = this.services[serviceName]

      if (service.requireDriver) {
        const found: string[] = this.ctx.drivers.getNames().filter((el) => {
          if (service.requireDriver?.includes(el)) return true
        })

        if (found.length !== service.requireDriver.length) {
          await service.destroy?.(SERVICE_DESTROY_REASON.noDependencies as ServiceDestroyReason)
          // do not register the driver if ot doesn't meet his dependencies
          delete this.services[serviceName]

          continue
        }
      }
      else if (service.required) {
        const found: string[] = this.getNames().filter((el) => {
          if (service.required?.includes(el)) return true
        })

        if (found.length !== service.required.length) {
          await service.destroy?.(SERVICE_DESTROY_REASON.noDependencies as ServiceDestroyReason)
          // do not register the driver if ot doesn't meet his dependencies
          delete this.services[serviceName]

          continue
        }
      }

      // TODO: сервисы могут инициализироваться друг за другом в заданном порядке. тоже с дестроем

      const cfgFilePath = pathJoin(CFG_DIRS.services, serviceName, SERVICE_CONFIG_FILE_NAME)
      let serviceCfg: Record<string, any> | undefined

      if (await this.system.files.cfg.exists(cfgFilePath)) {
        serviceCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
      }

      if (service.init) {
        this.ctx.log.debug(`ServicesManager: initializing service "${serviceName}"`)
        await service.init(serviceCfg)
      }
    }
  }

  async destroy() {
    for (const serviceName of Object.keys(this.services)) {
      const driver = this.services[serviceName]

      if (driver.destroy) {
        this.ctx.log.debug(`DriversManager: destroying driver "${serviceName}"`)
        await driver.destroy()
      }
    }
  }


  async start() {
    // TODO: если сервис не запустился то не поднимать ошибку выше, писать в лог
    // TODO: запускать только те сервисы которые помеченны для запуска
    // TODO: выстраивать порядок запуска
  }


  getService<T extends ServiceBase>(serviceName: string): T {
    return this.services[serviceName] as T
  }

  getNames(): string[] {
    return Object.keys(this.services)
  }

  useService(serviceIndex: ServiceIndex) {
    const service = serviceIndex(this.ctx)

    this.services[service.name] = service
  }

}
