import {pathJoin} from 'squidlet-lib'
import type {System} from '../System.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {CFG_DIRS, ROOT_DIRS, SYSTEM_CFG_DIR} from '../../types/contstants.js'


export class FilesManager {
  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {
    for (const dir of Object.keys(ROOT_DIRS)) {
      await this.driver.mkDirP('/' + dir)
    }

    for (const cfgDir of Object.keys(CFG_DIRS)) {
      await this.driver.mkDirP('/' + pathJoin(SYSTEM_CFG_DIR, cfgDir))
    }
  }

}
