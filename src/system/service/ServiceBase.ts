import {ServiceContext} from './ServiceContext.js'
import {System} from '../System.js'


// TODO: у сервиса должно быть состояния и события его смены
// TODO: сервисы могут инициализироваться друг за другом в заданном порядке
// TODO: тоже с дестроем

export abstract class ServiceBase {
  readonly abstract name: string

  // startAfter?: string[]
  // startBefore?: string[]
  // destroyAfter?: string[]
  // destroyBefore?: string[]

  private readonly system: System
  private readonly context: ServiceContext


  constructor(system: System) {
    this.system = system
    this.context = new ServiceContext(this.system)
  }

  async init() {
  }

  async destroy() {
    await this.context.destroy()
  }
}
