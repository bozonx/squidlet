import yaml from 'yaml'
import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {ServiceContext} from './ServiceContext.js'
import {ServiceIndex} from '../../types/types.js'
import {ServiceBase} from './ServiceBase.js'
import {CFG_DIRS} from '../../types/contstants.js'


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


  useService(serviceIndex: ServiceIndex) {
    const service = serviceIndex(this.ctx)

    this.services[service.name] = service
  }

}
