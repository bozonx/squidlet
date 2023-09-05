

// TODO: как зарегать приложение??? какой-то install script???
// TODO: можно навешаться на событие init, destroy

import {AppController} from './AppController.js'

export abstract class AppBase {
  abstract myName: string
  readonly requireDriver?: string[]
  protected ctl: AppController


  constructor(ctl: AppController) {
    this.ctl = ctl

  }


  // async init() {
  //   // TODO: будет выполненно на init
  // }

  init?(cfg?: Record<string, any>): Promise<void>
  destroy?(): Promise<void>

}
