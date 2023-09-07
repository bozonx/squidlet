import {System} from '../System.js'
import {IoBase} from './IoBase.js'
import {IoContext} from './IoContext.js'
import {IoSetBase} from './IoSetBase.js'
import {STANDARD_IO_NAMES} from '../../types/contstants.js'


export class IoManager {
  private readonly system: System
  private readonly ioSets: IoSetBase[] = []
  // object like {ioName: IoBase}
  private ios: Record<string, IoBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    this.ctx = new IoContext(this.system)
  }

  async init() {
    if (!this.ios[STANDARD_IO_NAMES.FileIo]) {
      throw new Error(`Can't find FileIo`)
    }

    for (const ioSet of this.ioSets) {
      await ioSet.init()
    }
  }

  async destroy() {
    for (const ioName of Object.keys(this.ios)) {
      delete this.ios[ioName]
    }

    for (const index in this.ioSets) {
      await this.ioSets[index].destroy()

      delete this.ioSets[index]
    }
  }


  getIo<T extends IoBase>(ioName: string): T {
    return this.ios[ioName] as T
  }

  getNames(): string[] {
    return Object.keys(this.ios)
  }

  useIoSet(ioSet: IoSetBase) {
    this.ioSets.push(ioSet)

    const ioNames = ioSet.getNames()

    for (const name of ioNames) {
      if (this.ios[name]) {
        throw new Error(`The IO "${name}" has already registered`)
      }

      this.ios[name] = ioSet.getIo(name)
    }
  }

}
