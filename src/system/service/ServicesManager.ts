import {System} from '../System.js'
import {ServiceContext} from './ServiceContext.js'
import {ServiceIndex} from '../../types/types.js'
import {ServiceBase} from './ServiceBase.js'


export class ServicesManager {
  private readonly system: System
  private services: Record<string, ServiceBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new ServiceContext(this.system)
  }

  async init() {
  }

  async destroy() {
  }


  async start() {
    // TODO: если сервис не запустился то не поднимать ошибку выше, писать в лог
  }


  useService(serviceIndex: ServiceIndex) {
    const service = serviceIndex(this.ctx)

    this.services[service.name] = service
  }

}
