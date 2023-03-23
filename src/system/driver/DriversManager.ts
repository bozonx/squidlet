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
      const driver = this.drivers[driverName]

      if (driver.requireIo) {
        const found: string[] = this.ctx.io.getNames().filter((el) => {
          if (driver.requireIo?.includes(el)) return true
        })

        if (found.length !== driver.requireIo.length) {
          await driver.destroy?.()
          // do not register the driver if ot doesn't meet his dependencies
          delete this.drivers[driverName]

          continue
        }
      }

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
    for (const driverName of Object.keys(this.drivers)) {
      const driver = this.drivers[driverName]

      if (driver.destroy) {
        this.ctx.log.debug(`DriversManager: destroying driver "${driverName}"`)
        await driver.destroy()
      }
    }
  }


  getDriver<T extends DriverBase>(driverName: string): T {
    return this.drivers[driverName] as T
  }

  getNames(): string[] {
    return Object.keys(this.drivers)
  }

  useDriver(driverIndex: DriverIndex) {
    const driver = driverIndex(this.ctx)

    this.drivers[driver.name] = driver
  }

}
