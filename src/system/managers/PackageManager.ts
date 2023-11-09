import {pathJoin} from 'squidlet-lib'
import type {System} from '../System.js'
import {PackageContext} from '../context/PackageContext.js'
import type {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'


export class PackageManager {
  private readonly system
  readonly ctx

  private get filesDriver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }


  constructor(system: System) {
    this.system = system
    this.ctx = new PackageContext(this.system)
  }


  async destroy() {
    // TODO: дестроить то на что пакеты навешались дестроить
  }

  // TODO: наверное сделать отдельный дестрой для системных пакетов и пользовательских


  async loadInstalled() {
    // TODO: не правильно
    // const appsDirContent = await this.filesDriver.readDir(pathJoin(ROOT_DIRS.appFiles))
    //
    // for (const appDir of appsDirContent) {
    //   // TODO: не правильно
    //   const indexFilePath = pathJoin(ROOT_DIRS.appFiles, appDir, 'index.js')
    //   const indexFileContent = await this.filesDriver.readTextFile(indexFilePath)
    //
    //   // TODO: Что делать с зависимостями этого фала ???? сбилдить в 1 файл в require???
    //   // TODO: засунуть в sandbox
    //
    //   // TODO: должен ещё быть запущен init io, driver, service который предоставляет пакет
    // }
  }

  async install() {
    // TODO: add
  }

  async update() {
    // TODO: чтобы обновить пакет нужно понять что к нему относится
  }

  async uninstall() {
    // TODO: чтобы удалить пакет нужно понять что к нему относится
  }

}
