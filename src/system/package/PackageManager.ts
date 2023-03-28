import {pathJoin} from 'squidlet-lib'
import {System} from '../System.js'
import {PackageContext} from './PackageContext.js'
import {FilesDriver} from '../../drivers/FilesDriver/FilesDriver.js'
import {ROOT_DIRS} from '../../types/contstants.js'


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


  async loadInstalled() {
    const appsDirContent = await this.filesDriver.readDir(pathJoin(ROOT_DIRS.appFiles))

    for (const appDir of appsDirContent) {
      const indexFilePath = pathJoin(ROOT_DIRS.appFiles, appDir, 'index.js')
      const indexFileContent = await this.filesDriver.readTextFile(indexFilePath)

      // TODO: Что делать с зависимостями этого фала ???? сбилдить в 1 файл в require???
      // TODO: засунуть в sandbox

    }
  }

  async install() {
    // TODO: add
  }

}
