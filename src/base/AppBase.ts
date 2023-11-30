
export const NOT_ALLOWED_APP_PROPS = [
  'myName',
  'requireDriver',
  'constructor',
  '$setCtx',
  'init',
  'destroy',
  'getApi',
]


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

  /**
   * Public local api of app.
   * Put here only api which is accessible on local machine.
   * For api which is accessible on network use PublicApiService
   */
  getApi?(): any
}
