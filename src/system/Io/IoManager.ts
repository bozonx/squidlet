import {System} from '../System.js'
import {IoIndex} from '../../types/types.js'
import {IoBase} from './IoBase.js'
import {IoContext} from './IoContext.js'


export class IoManager {
  private readonly system: System
  private ios: Record<string, IoBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new IoContext(this.system)
  }

  async init() {
    for (const ioName of Object.keys(this.ios)) {
      const ioItem = this.ios[ioName]
      const ioCfg: Record<string, any> | undefined = await this.system.configs
        .loadIoConfig(ioName)

      if (ioItem.init) {
        this.ctx.log.debug(`IoManager: initializing IO "${ioName}"`)
        await ioItem.init(ioCfg)
      }
    }
  }

  async destroy() {
    for (const ioName of Object.keys(this.ios)) {
      const ioItem = this.ios[ioName]

      if (ioItem.destroy) {
        this.ctx.log.debug(`IoManager: destroying IO "${ioName}"`)
        await ioItem.destroy()
      }
    }
  }


  getIo<T>(ioName: string): T {
    return this.ios[ioName] as T
  }

  getNames(): string[] {
    return Object.keys(this.ios)
  }

  useIo(ioIndex: IoIndex) {
    const io = ioIndex(this.ctx)
    const ioName: string = io.myName || io.constructor.name

    if (this.ios[ioName]) {
      throw new Error(`The same IO "${ioName} is already in use"`)
    }

    this.ios[ioName] = io
  }

}
