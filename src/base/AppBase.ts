

// TODO: как зарегать приложение??? какой-то install script???
// TODO: можно навешаться на событие init, destroy

import type {AppContext} from '../system/context/AppContext.js'

export abstract class AppBase {
  abstract myName: string
  readonly requireDriver?: string[]
  ctx!: AppContext


  constructor() {
  }

  $setCtx(ctx: AppContext) {
    this.ctx = ctx
  }


  // async init() {
  //   // TODO: будет выполненно на init
  // }

  init?(cfg?: Record<string, any>): Promise<void>
  destroy?(): Promise<void>

}
