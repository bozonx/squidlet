import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class FilesManager {
  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {

    // TODO: поидее надо не каждый раз делать а только при первом запуске

    // for (const dir of Object.keys(ROOT_DIRS)) {
    //   await this.driver.mkDirP(dir)
    // }
    //
    // for (const cfgDir of Object.keys(CFG_DIRS)) {
    //   await this.driver.mkDirP(pathJoin(SYSTEM_CFG_DIR, cfgDir))
    // }
  }

}
