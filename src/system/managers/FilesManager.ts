import type {System} from '../System.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {
  SYSTEM_SUB_DIRS,
  ROOT_DIRS,
  SYSTEM_CFG_DIR,
  SYSTEM_DIR,
  HOME_SUB_DIRS,
  COMMON_DIR,
} from '../../types/constants.js'


export class FilesManager {
  private readonly system: System

  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {
    // create root dirs
    for (const dir of Object.keys(ROOT_DIRS)) {
      await this.driver.mkDirP('/' + dir)
    }

    // /appDataLocal/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.appDataLocal}/${SYSTEM_DIR}/${dir}`)
    }
    // /appDataSynced/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.appDataSynced}/${SYSTEM_DIR}/${dir}`)
    }
    // /cacheLocal/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.cacheLocal}/${SYSTEM_DIR}/${dir}`)
    }
    // /cacheLocal/common
    await this.driver.mkDirP(`/${ROOT_DIRS.cacheLocal}/${COMMON_DIR}`)
    // create system cfgLocal sub dirs
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(SYSTEM_CFG_DIR + '/' + dir)
    }
    // /cfgLocal/common
    await this.driver.mkDirP(`/${ROOT_DIRS.cfgLocal}/${COMMON_DIR}`)
    // create system cfgSynced sub dirs
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.cfgSynced}/${SYSTEM_DIR}/${dir}`)
    }
    // /cfgSynced/common
    await this.driver.mkDirP(`/${ROOT_DIRS.cfgSynced}/${COMMON_DIR}`)
    // /db/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.db}/${SYSTEM_DIR}/${dir}`)
    }
    // /db/common
    await this.driver.mkDirP(`/${ROOT_DIRS.db}/${COMMON_DIR}`)
    // /log/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.log}/${SYSTEM_DIR}/${dir}`)
    }
    // /log/common
    await this.driver.mkDirP(`/${ROOT_DIRS.log}/${COMMON_DIR}`)
    // /tmpLocal/system/...
    for (const dir of Object.keys(SYSTEM_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.tmpLocal}/${SYSTEM_DIR}/${dir}`)
    }
    // /tmpLocal/common
    await this.driver.mkDirP(`/${ROOT_DIRS.tmpLocal}/${COMMON_DIR}`)
    // /home/...
    for (const dir of Object.keys(HOME_SUB_DIRS)) {
      await this.driver.mkDirP(`/${ROOT_DIRS.home}/${dir}`)
    }
  }

}
