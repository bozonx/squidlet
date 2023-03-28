import yaml from 'yaml'
import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {SystemCfg, systemCfgDefaults} from '../../types/SystemCfg.js'
import {CFG_DIRS, SYSTEM_CFG_DIR, SYSTEM_CONFIG_FILE} from '../../types/contstants.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class ConfigsManager {
  systemCfg: SystemCfg = systemCfgDefaults

  private readonly system: System

  private get filesDriver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {
    const cfgFilePath = pathJoin(SYSTEM_CONFIG_FILE)
    let fileContent: string

    try {
      fileContent = await this.filesDriver.readTextFile(cfgFilePath)
    }
    catch (e) {
      return
    }

    const loadedCfg = yaml.parse(fileContent)

    this.systemCfg = {
      ...this.systemCfg,
      ...loadedCfg
    }

    // TODO: валидировать - пути в versionsCount должны начинаться со слеша
  }


  async loadIoConfig(ioName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.ios, ioName + '.yml')
    let fileContent: string

    try {
      fileContent = await this.filesDriver.readTextFile(cfgFilePath)
    }
    catch (e) {
      return
    }

    return yaml.parse(fileContent)
  }

  async loadDriverConfig(driverName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.drivers, driverName + '.yml')
    let fileContent: string

    try {
      fileContent = await this.filesDriver.readTextFile(cfgFilePath)
    }
    catch (e) {
      return
    }

    return yaml.parse(fileContent)
  }

  async saveIoConfig(ioName: string, newConfig: Record<string, any>) {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.ios, ioName + '.yml')
    const dataStr = yaml.stringify(newConfig)

    await this.filesDriver.writeFile(cfgFilePath, dataStr)
  }

  async saveDriverConfig(driverName: string, newConfig: Record<string, any>) {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.drivers, driverName + '.yml')
    const dataStr = yaml.stringify(newConfig)

    await this.filesDriver.writeFile(cfgFilePath, dataStr)
  }

  async removeIoConfig(ioName: string) {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.ios, ioName + '.yml')

    await this.filesDriver.unlink(cfgFilePath)
  }

  async removeDriverConfig(driverName: string) {
    const cfgFilePath = pathJoin(SYSTEM_CFG_DIR, CFG_DIRS.drivers, driverName + '.yml')

    await this.filesDriver.unlink(cfgFilePath)
  }

}
