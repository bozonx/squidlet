
// TODO: не импортировать??? есть ли там nodejs зависимости???
import yaml from 'yaml'
import {pathJoin, mergeDeepObjects} from 'squidlet-lib'
import type {System} from '../System.js'
import {systemCfgDefaults} from '../../types/SystemCfg.js'
import type {SystemCfg} from '../../types/SystemCfg.js'
import {
  SYSTEM_SUB_DIRS,
  CFG_FILE_EXT,
  SYSTEM_CFG_DIR,
  SYSTEM_CONFIG_FILE,
} from '../../types/constants.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export function makeYamlString(obj: any): string {
  return yaml.stringify(obj)
}


export class SystemConfigsManager {
  systemCfg: SystemCfg = systemCfgDefaults

  private readonly system: System

  private get filesDriver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
  }

  async init() {
    let loadedCfg: SystemCfg = systemCfgDefaults

    if (await this.filesDriver.isExists(SYSTEM_CONFIG_FILE)) {
      const fileContent = await this.filesDriver.readTextFile(SYSTEM_CONFIG_FILE)

      loadedCfg = yaml.parse(fileContent)
    }
    else {
      // if not exist then make a new file with default config
      await this.filesDriver.writeFile(SYSTEM_CONFIG_FILE, makeYamlString(systemCfgDefaults))
    }

    this.systemCfg = {
      ...this.systemCfg,
      ...loadedCfg
    }
  }


  async loadIoConfig(ioName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.ios,
      `${ioName}.${CFG_FILE_EXT}`
    )

    return this.loadConfig(cfgFilePath)
  }

  async loadDriverConfig(driverName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.drivers,
      `${driverName}.${CFG_FILE_EXT}`
    )

    return this.loadConfig(cfgFilePath)
  }

  async loadServiceConfig(serviceName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.services,
      `${serviceName}.${CFG_FILE_EXT}`
    )

    return this.loadConfig(cfgFilePath)
  }

  async saveIoConfig(ioName: string, newConfig: Record<string, any>) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.ios,
      `${ioName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.writeFile(cfgFilePath, makeYamlString(newConfig))
  }

  async saveDriverConfig(driverName: string, newConfig: Record<string, any>) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.drivers,
      `${driverName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.writeFile(cfgFilePath, makeYamlString(newConfig))
  }

  async saveServiceConfig(serviceName: string, newConfig: Record<string, any>) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.services,
      `${serviceName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.writeFile(cfgFilePath, makeYamlString(newConfig))
  }

  async removeIoConfig(ioName: string) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.ios,
      `${ioName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.unlink(cfgFilePath)
  }

  async removeDriverConfig(driverName: string) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.drivers,
      `${driverName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.unlink(cfgFilePath)
  }

  async removeServiceConfig(serviceName: string) {
    const cfgFilePath = pathJoin(
      SYSTEM_CFG_DIR,
      SYSTEM_SUB_DIRS.services,
      `${serviceName}.${CFG_FILE_EXT}`
    )

    await this.filesDriver.unlink(cfgFilePath)
  }

  async setSystemCfg(partial: Partial<SystemCfg>) {

    // TODO: валидировать
    // TODO: валидировать - пути в versionsCount должны начинаться со слеша

    this.systemCfg = mergeDeepObjects(partial, this.systemCfg)

    await this.filesDriver.writeFile(SYSTEM_CONFIG_FILE, makeYamlString(this.systemCfg))
  }


  private async loadConfig(cfgFilePath: string) {
    if (await this.filesDriver.isExists(cfgFilePath)) {
      const fileContent = await this.filesDriver.readTextFile(cfgFilePath)

      return yaml.parse(fileContent)
    }
  }

}
