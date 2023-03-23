import yaml from 'yaml'
import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {DriverIndex} from '../../types/types.js'
import {DriverBase} from './DriverBase.js'
import {DriverContext} from './DriverContext.js'
import {CFG_DIRS} from '../../types/contstants.js'


export class DriversManager {
  private readonly system: System
  private drivers: Record<string, DriverBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new DriverContext(this.system)
  }

  async init() {
    for (const driverName of Object.keys(this.drivers)) {

      // TODO: если драйвер требует IO а его нет то драйвер не регистрируем

      const driver = this.drivers[driverName]
      const cfgFilePath = pathJoin(CFG_DIRS.drivers, driverName + '.yml')
      let driverCfg: Record<string, any> | undefined

      if (await this.system.files.cfg.exists(cfgFilePath)) {
        driverCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
      }

      if (driver.init) {
        this.ctx.log.debug(`DriversManager: initializing driver "${driverName}"`)
        await driver.init(driverCfg)
      }
    }
  }

  async destroy() {
    for (const ioName of Object.keys(this.drivers)) {
      const driver = this.drivers[ioName]

      if (driver.destroy) {
        this.ctx.log.debug(`DriversManager: destroying driver "${ioName}"`)
        await driver.destroy()
      }
    }
  }


  useDriver(driverIndex: DriverIndex) {
    const driver = driverIndex(this.ctx)

    this.drivers[driver.name] = driver
  }

}
