import {pathDirname} from 'squidlet-lib'
import type {System} from '../system/System.js'
import type {FilesDriver} from '../drivers/FilesDriver/FilesDriver.js'


// TODO: может это лучше драйвером сделать ????

/**
 * It is file versioning manager
 */
export class VersionsManager {
  private readonly system: System


  private get driver(): FilesDriver {
    return this.system.drivers.getDriver('FilesDriver')
  }

  constructor(system: System) {
    this.system = system
  }


  async init() {

  }


  async incrementFileVersion(pathToFile: string) {
    const dirName = pathDirname(pathToFile)
    const versionsCount = this.resolveVersionsCount(dirName)

    // TODO: add
  }

  async removeFileVersions(pathToFile: string) {
    // TODO: add
  }

  async removeVersionsDirRecursively(pathToDir: string) {
    // TODO: add
  }

  async renameVersions(files: [string, string][]) {
    // TODO: add
  }

  async actualise(rootPath: string) {
    // TODO: remove unused version and dirs
    // TODO: run it in cron???
  }


  private resolveVersionsCount(dirName: string): number {

    return -1
    // TODO: в конфиге можно указать какие директории имеюют сколько версий
    //       тогда нужно каждый раз сравнивать с конфигом чтобы понять сколько версий использовать
  }

}
