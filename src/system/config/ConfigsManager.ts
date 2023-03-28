import {System} from '../System.js'
import {SystemCfg, systemCfgDefaults} from '../../types/SystemCfg.js'
import yaml from 'yaml'
import {pathJoin} from '../../../../../../../../mnt/disk2/workspace/squidlet-lib/lib/index.js'
import {CFG_DIRS} from '../../types/contstants.js'


export class ConfigsManager {
  readonly systemCfg: SystemCfg = systemCfgDefaults

  private readonly system: System


  constructor(system: System) {
    this.system = system
  }

  async init() {
    // TODO: load system config and overwrite defaults
  }

  async destroy() {
  }


  async loadIoConfig(ioName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(CFG_DIRS.ios, ioName + '.yml')
    let ioCfg: Record<string, any> | undefined

    if (await this.system.files.cfg.exists(cfgFilePath)) {
      ioCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
    }
  }

  async loadDriverConfig(driverName: string): Promise<Record<string, any> | undefined> {
    const cfgFilePath = pathJoin(CFG_DIRS.drivers, driverName + '.yml')

  }

  async saveIoConfig(ioName: string, newConfig: Record<string, any>) {

  }

  async saveDriverConfig(driverName: string, newConfig: Record<string, any>) {

  }

  async removeIoConfig(ioName: string) {

  }

  async removeDriverConfig(driverName: string) {

  }

}
