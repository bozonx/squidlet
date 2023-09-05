

// TODO: как зарегать приложение??? какой-то install script???
// TODO: можно навешаться на событие init, destroy

import {AppController} from './AppController.js'

export abstract class AppBase {
  abstract myName: string

  private ctl: AppController


  constructor(ctl: AppController) {
    this.ctl = ctl

  }


  async init() {
    // TODO: будет выполненно на init
  }

}
