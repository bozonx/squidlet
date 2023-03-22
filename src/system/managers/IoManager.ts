import {System} from '../System.js'
import {IoSetBase} from '../../types/IoSet.js'


export class IoManager {
  private readonly system: System
  //private readonly ioSet: IoSetBase


  constructor(system: System) {
    this.system = system
    //this.ioSet = ioSet
  }

  async init() {
    // TODO: загружаем io, которые были ранее установленны
    // TODO: нужно делать напрямую без сервиса файловой системы, так как она тоже IO
    // TODO: Либо в первую очередь инициализировать файловую системы
    // TODO: запуск через sandbox
  }

  async destroy() {
  }

}
