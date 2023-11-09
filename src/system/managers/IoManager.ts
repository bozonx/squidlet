import type {System} from '../System.js'
import type {IoBase} from '../../base/IoBase.js'
import {IoContext} from '../context/IoContext.js'
import type {IoSetBase} from '../../base/IoSetBase.js'
import {IO_NAMES} from '../../types/constants.js'


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
    if (!this.ios[IO_NAMES.FilesIo]) {
      throw new Error(`Can't find FilesIo`)
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
    ioSet.$giveIoContext(this.ctx)

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
