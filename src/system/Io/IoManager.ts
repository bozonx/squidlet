import {System} from '../System.js'
import {IoSetBase} from '../../types/IoSet.js'
import {IoIndex} from '../../types/types.js'
import {IoBase} from './IoBase.js'
import {IoContext} from './IoContext.js'


export class IoManager {
  private readonly system: System
  //private readonly ioSet: IoSetBase
  private ios: Record<string, IoBase> = {}
  private readonly ctx


  constructor(system: System) {
    this.system = system
    //this.ioSet = ioSet
    this.ctx = new IoContext(this.system)
  }

  async init() {
    // TODO: загружаем io, которые были ранее установленны
    // TODO: нужно делать напрямую без сервиса файловой системы, так как она тоже IO
    // TODO: Либо в первую очередь инициализировать файловую системы
    // TODO: запуск через sandbox
  }

  async destroy() {
  }


  useIo(ioIndex: IoIndex) {
    const io = ioIndex(this.ctx)

    this.ios[io.name] = io
  }

}
