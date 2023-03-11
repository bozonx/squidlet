import {System} from '../System.js'


export class IoManager {
  private readonly system: System


  constructor(system: System) {
    this.system = system
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
