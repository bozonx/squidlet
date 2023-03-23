import yaml from 'yaml'
import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {IoIndex} from '../../types/types.js'
import {IoBase} from './IoBase.js'
import {IoContext} from './IoContext.js'
import {CFG_DIRS} from '../../types/contstants.js'


export class IoManager {
  private readonly system: System
  private ios: Record<string, IoBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new IoContext(this.system)
  }

  async init() {
    await this.configureAllIo()
  }

  async destroy() {
    for (const ioName of Object.keys(this.ios)) {
      const ioItem = this.ios[ioName]

      if (ioItem.destroy) {
        this.ctx.log.debug(`IoManager: destroy IO "${ioName}"`)
        await ioItem.destroy()
      }
    }
  }


  getIo<T extends IoBase>(ioName: string): T {
    return this.ios[ioName] as T
  }

  getNames(): string[] {
    return Object.keys(this.ios)
  }

  useIo(ioIndex: IoIndex) {
    const io = ioIndex(this.ctx)

    if (this.ios[io.name]) {
      throw new Error(`The same IO "${io.name} is already in use"`)
    }

    this.ios[io.name] = io
  }


  private async configureAllIo() {
    for (const ioName of Object.keys(this.ios)) {
      const ioItem = this.ios[ioName]
      const cfgFilePath = pathJoin(CFG_DIRS.ios, ioName + '.yml')
      let ioCfg: Record<string, any> | undefined

      if (await this.system.files.cfg.exists(cfgFilePath)) {
        ioCfg = yaml.parse(await this.system.files.cfg.readTextFile(cfgFilePath))
      }

      if (ioItem.configure && ioCfg) {
        this.ctx.log.debug(`IoManager: configure io "${ioName}" with ${JSON.stringify(ioCfg)}`)
        await ioItem.configure(ioCfg)
      }

      if (ioItem.init) {
        this.ctx.log.debug(`IoManager: initialize IO "${ioName}"`)
        await ioItem.init()
      }
    }
  }

}
