import {ServiceContext} from './ServiceContext.js'


// TODO: у сервиса должно быть состояния и события его смены
// TODO: сервисы могут инициализироваться друг за другом в заданном порядке
// TODO: тоже с дестроем

export abstract class ServiceBase {
  readonly requireDriver?: string[]
  readonly abstract name: string

  // startAfter?: string[]
  // startBefore?: string[]
  // destroyAfter?: string[]
  // destroyBefore?: string[]

  private readonly ctx: ServiceContext


  constructor(ctx: ServiceContext) {
    this.ctx = ctx
  }

  init?: (cfg?: Record<string, any>) => Promise<void>

  destroy?: () => Promise<void>

}
